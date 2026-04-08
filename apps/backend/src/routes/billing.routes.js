import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { stripe } from '../stripe.js';
import { hasPremiumAccess } from '../constants.js';

const router = Router();

router.post('/create-checkout-session', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: {
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const customerId =
    user.stripeCustomerId ||
    (
      await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      })
    ).id;

  if (!user.stripeCustomerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const successUrl = `${process.env.FRONTEND_URL}/billing?status=success`;
  const cancelUrl = `${process.env.FRONTEND_URL}/billing?status=cancelled`;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId: user.id },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: user.id,
    },
  });

  return res.json({ url: session.url });
});

export default router;

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

  const customerId = user.stripeCustomerId || `promo_${user.id}`;

  if (!user.stripeCustomerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: 'active',
        stripeCustomerId: customerId,
        currentPeriodStart: now,
        currentPeriodEnd: promoEndsAt,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: customerId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: promoEndsAt,
      },
    });
  }

  return res.json({ message: 'Promo code applied! You now have 1 month of access.' });
});
