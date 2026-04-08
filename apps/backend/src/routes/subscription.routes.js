import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { PREMIUM_STATUSES, hasPremiumAccess, isAdminEmail } from "../constants.js";

const router = Router();

router.get("/", async (req, res) => {
  if (isAdminEmail(req.user?.email)) {
    return res.json({
      status: "active",
      isAdminBypass: true,
      plan: "admin",
      hasPremiumAccess: true,
      accessEndsAt: null,
    });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" },
  });

  if (subscription && PREMIUM_STATUSES.includes(subscription.status) && hasPremiumAccess(subscription) === false) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "inactive" },
    });

    return res.json({
      ...subscription,
      status: "inactive",
      hasPremiumAccess: false,
      accessEndsAt: subscription.currentPeriodEnd ?? subscription.trialEnd ?? null,
    });
  }

  if (!subscription) {
    return res.json({ status: "inactive", hasPremiumAccess: false, accessEndsAt: null });
  }

  return res.json({
    ...subscription,
    hasPremiumAccess: hasPremiumAccess(subscription),
    accessEndsAt: subscription.currentPeriodEnd ?? subscription.trialEnd ?? null,
  });
});

export default router;
