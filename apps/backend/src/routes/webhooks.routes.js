import { Router } from 'express';
import squarePkg from 'square';
import { prisma } from '../db/prisma.js';
import { hasPremiumAccess } from '../constants.js';

const { WebhooksHelper } = squarePkg;

const router = Router();

// Square webhook handler
router.post('/square', async (req, res) => {
  const signatureHeader = req.headers['x-square-hmacsha256-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  const requestBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';

  if (!signature || !requestBody) {
    return res.status(403).json({ message: 'Missing signature or body' });
  }

  if (!process.env.SQUARE_WEBHOOK_SIGNING_KEY) {
    return res.status(500).json({ message: 'Missing SQUARE_WEBHOOK_SIGNING_KEY.' });
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const notificationUrl = `${protocol}://${host}${req.originalUrl}`;

  const isValidSignature = await WebhooksHelper.verifySignature({
    requestBody,
    signatureHeader: signature,
    signatureKey: process.env.SQUARE_WEBHOOK_SIGNING_KEY,
    notificationUrl,
  });

  if (!isValidSignature) {
    return res.status(403).json({ message: 'Invalid signature' });
  }

  try {
    const event = JSON.parse(requestBody);

    // Process the canonical completion event and ignore others.
    if (event.type === 'payment.created') {
      const payment = event?.data?.object?.payment;
      const customerId = payment?.customerId;
      const note = payment?.note || '';
      const userIdFromNote = typeof note === 'string' ? note.match(/athleteos-user:([a-z0-9]+)/i)?.[1] : null;

      // Only process completed payments
      if (!payment || payment.status !== 'COMPLETED') {
        return res.json({ received: true });
      }

      const user = userIdFromNote
        ? await prisma.user.findUnique({ where: { id: userIdFromNote } })
        : await prisma.user.findFirst({ where: { stripeCustomerId: customerId || undefined } });

      if (user) {
        const now = new Date();
        const existing = await prisma.subscription.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        });

        // Skip duplicate delivery for the same Square order.
        if (existing?.stripePriceId && payment.orderId && existing.stripePriceId === payment.orderId) {
          return res.json({ received: true, duplicate: true });
        }

        const start = existing?.currentPeriodEnd && existing.currentPeriodEnd > now
          ? new Date(existing.currentPeriodEnd)
          : now;
        const endsAt = new Date(start);
        endsAt.setMonth(endsAt.getMonth() + 1);

        if (!user.stripeCustomerId && customerId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customerId },
          });
        }

        if (existing && hasPremiumAccess(existing)) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: {
              status: 'active',
              stripeCustomerId: customerId || existing.stripeCustomerId,
              stripePriceId: payment.orderId || existing.stripePriceId,
              currentPeriodStart: start,
              currentPeriodEnd: endsAt,
            },
          });
        } else if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: {
              status: 'active',
              stripeCustomerId: customerId || existing.stripeCustomerId,
              stripePriceId: payment.orderId || existing.stripePriceId,
              currentPeriodStart: now,
              currentPeriodEnd: endsAt,
            },
          });
        } else {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              stripeCustomerId: customerId || `square_${user.id}`,
              stripePriceId: payment.orderId || null,
              status: 'active',
              currentPeriodStart: now,
              currentPeriodEnd: endsAt,
            },
          });
        }
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ message: error.message });
  }
});

export default router;
