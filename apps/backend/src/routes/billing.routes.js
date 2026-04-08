import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma.js';
import { paymentsApi, customersApi } from '../square.js';
import { hasPremiumAccess } from '../constants.js';

const router = Router();

// Create payment for subscription
router.post('/create-checkout-session', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create or get Square customer
    let customerId = user.squareCustomerId;

    if (!customerId) {
      const result = await customersApi.createCustomer({
        emailAddress: user.email,
        givenName: user.name.split(' ')[0],
        familyName: user.name.split(' ').slice(1).join(' ') || 'Athlete',
      });

      customerId = result.result.customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { squareCustomerId: customerId },
      });
    }

    // Price in cents ($9.99 = 999 cents)
    const amountCents = 999n;

    const paymentRequest = {
      sourceId: 'cnp',
      idempotencyKey: uuidv4(),
      amountMoney: {
        amount: amountCents,
        currency: 'USD',
      },
      customerId: customerId,
      note: 'AthleteOS Premium Subscription - $9.99/month',
    };

    const response = await paymentsApi.createPayment(paymentRequest);

    if (response.result.payment.status === 'COMPLETED') {
      // Payment succeeded, activate subscription for 1 month
      const now = new Date();
      const endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + 1);

      const existing = user.subscriptions?.[0];

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: 'active',
            squareCustomerId: customerId,
            currentPeriodStart: now,
            currentPeriodEnd: endsAt,
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            squareCustomerId: customerId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: endsAt,
          },
        });
      }

      return res.json({ success: true, message: 'Payment completed and subscription activated' });
    }

    return res.status(400).json({ message: 'Payment declined or incomplete', payment: response.result.payment });
  } catch (error) {
    console.error('Square checkout error:', error);
    return res.status(500).json({ message: 'Failed to process payment', error: error.message });
  }
});

// Redeem promo code
router.post('/redeem-promo', async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: 'Promo code is required.' });
  }

  const validCodes = (process.env.PROMO_CODES || '')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (!validCodes.includes(code.trim().toUpperCase())) {
    return res.status(400).json({ message: 'Invalid promo code.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  const existing = user?.subscriptions?.[0];

  if (hasPremiumAccess(existing)) {
    return res.status(400).json({ message: 'Your account already has an active subscription.' });
  }

  const now = new Date();
  const promoEndsAt = new Date(now);
  promoEndsAt.setMonth(promoEndsAt.getMonth() + 1);

  const customerId = user.squareCustomerId || `promo_${user.id}`;

  if (!user.squareCustomerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { squareCustomerId: customerId },
    });
  }

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: 'active',
        squareCustomerId: customerId,
        currentPeriodStart: now,
        currentPeriodEnd: promoEndsAt,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        squareCustomerId: customerId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: promoEndsAt,
      },
    });
  }

  return res.json({ message: 'Promo code applied! You now have 1 month of access.' });
});

export default router;
