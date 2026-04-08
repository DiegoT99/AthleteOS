import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { isAdminEmail } from "../constants.js";

const router = Router();

router.get("/", async (req, res) => {
  if (isAdminEmail(req.user?.email)) {
    return res.json({
      status: "active",
      isAdminBypass: true,
      plan: "admin",
    });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" },
  });

  return res.json(subscription ?? { status: "inactive" });
});

export default router;
