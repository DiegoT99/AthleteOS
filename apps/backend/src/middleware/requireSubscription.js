import { prisma } from "../db/prisma.js";
import { PREMIUM_STATUSES, hasPremiumAccess, isAdminEmail } from "../constants.js";

export const requirePremium = async (req, res, next) => {
  if (isAdminEmail(req.user?.email)) {
    req.subscription = {
      status: "active",
      isAdminBypass: true,
      plan: "admin",
    };

    return next();
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
  }

  if (hasPremiumAccess(subscription) === false) {
    return res.status(402).json({
      message: "Premium subscription required",
      subscriptionStatus: subscription?.status ?? "inactive",
    });
  }

  req.subscription = subscription;
  return next();
};
