import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { stripe } from '../stripe.js';

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
      trial_period_days: 7,
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
