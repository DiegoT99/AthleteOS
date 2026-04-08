import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { stripe } from '../stripe.js';

const router = Router();

const toSubscriptionStatus = (status) => {
  const allowed = ['trialing', 'active', 'past_due', 'canceled', 'unpaid'];
  if (allowed.includes(status)) {
    return status;
  }
  return 'inactive';
};

const upsertSubscription = async ({ userId, customerId, stripeSub }) => {
  const status = toSubscriptionStatus(stripeSub.status);

  return prisma.subscription.upsert({
    where: { stripeSubscriptionId: stripeSub.id },
    update: {
      status,
      stripeCustomerId: customerId,
      stripePriceId: stripeSub.items.data[0]?.price?.id,
      trialStart: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000) : null,
      trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
      currentPeriodStart: stripeSub.current_period_start
        ? new Date(stripeSub.current_period_start * 1000)
        : null,
      currentPeriodEnd: stripeSub.current_period_end
        ? new Date(stripeSub.current_period_end * 1000)
        : null,
      canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
    },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: stripeSub.items.data[0]?.price?.id,
      status,
      trialStart: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000) : null,
      trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
      currentPeriodStart: stripeSub.current_period_start
        ? new Date(stripeSub.current_period_start * 1000)
        : null,
      currentPeriodEnd: stripeSub.current_period_end
        ? new Date(stripeSub.current_period_end * 1000)
        : null,
      canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
    },
  });
};

router.post('/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type.startsWith('customer.subscription')) {
      const stripeSub = event.data.object;
      const customerId = stripeSub.customer;

      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await upsertSubscription({ userId: user.id, customerId, stripeSub });
      }
    }

    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const stripeSubscriptionId = invoice.subscription;

      const status = event.type === 'invoice.paid' ? 'active' : 'past_due';

      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId, stripeSubscriptionId },
        data: { status },
      });
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
