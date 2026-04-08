import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';

const router = Router();

// Square webhook handler
router.post('/square', async (req, res) => {
  const signature = req.headers['x-square-hmac-sha256'];
  const body = req.rawBody;

  if (!signature || !body) {
    return res.status(403).json({ message: 'Missing signature or body' });
  }

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha256', process.env.SQUARE_WEBHOOK_SIGNING_KEY)
    .update(body)
    .digest('base64');

  if (hash !== signature) {
    return res.status(403).json({ message: 'Invalid signature' });
  }

  try {
    const event = req.body;

    if (event.type === 'payment.created' || event.type === 'payment.updated') {
      const payment = event.data.object.payment;
      const customerId = payment.customer_id;

      // Only process completed payments
      if (payment.status !== 'COMPLETED') {
        return res.json({ received: true });
      }

      // Find user by Square customer ID
      const user = await prisma.user.findFirst({
        where: { squareCustomerId: customerId },
      });

      if (user) {
        // Mark subscription as active for 1 month
        const now = new Date();
        const endsAt = new Date(now);
        endsAt.setMonth(endsAt.getMonth() + 1);

        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            status: 'active',
            squareCustomerId: customerId,
            currentPeriodStart: now,
            currentPeriodEnd: endsAt,
          },
          create: {
            userId: user.id,
            squareCustomerId: customerId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: endsAt,
          },
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ message: error.message });
  }
});

export default router;
