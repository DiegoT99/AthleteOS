import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma.js';
import { squareClient } from '../square.js';
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

    if (!process.env.SQUARE_LOCATION_ID) {
      return res.status(500).json({ message: 'Square is not configured: missing SQUARE_LOCATION_ID.' });
    }

    const paymentNote = `athleteos-user:${user.id}`;

    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: uuidv4(),
      description: 'AthleteOS monthly subscription access',
      quickPay: {
        name: 'AthleteOS Premium - Monthly',
        priceMoney: {
          amount: BigInt(999),
          currency: 'USD',
        },
        locationId: process.env.SQUARE_LOCATION_ID,
      },
      checkoutOptions: {
        redirectUrl: `${process.env.FRONTEND_URL}/billing?status=success`,
      },
      prePopulatedData: {
        buyerEmail: user.email,
      },
      paymentNote,
    });

    const paymentLink = response?.paymentLink || response?.result?.paymentLink;

    if (!paymentLink?.url) {
      return res.status(500).json({ message: 'Square did not return a checkout URL.' });
    }

    return res.json({ url: paymentLink.url });
  } catch (error) {
    console.error('Square checkout error:', error);
    return res.status(500).json({ message: 'Failed to create checkout link', error: error.message });
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

  const customerId = user.stripeCustomerId || `square_promo_${user.id}`;

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

export default router;
