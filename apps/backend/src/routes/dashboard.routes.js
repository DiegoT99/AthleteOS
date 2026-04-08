import { Router } from 'express';
import { prisma } from '../db/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
  const userId = req.user.userId;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const whereBase = {
    userId,
    ...(categoryId ? { categoryId } : {}),
  };

  const [
    todayCount,
    weeklyCount,
    recentNotes,
    streakSource,
    latestSubscription,
    recentSessions,
    goals,
  ] = await Promise.all([
    prisma.trainingSession.count({
      where: { ...whereBase, date: { gte: todayStart } },
    }),
    prisma.trainingSession.count({
      where: { ...whereBase, date: { gte: startOfWeek } },
    }),
    prisma.note.findMany({
      where: {
        userId,
        ...(categoryId ? { OR: [{ categoryId }, { isGlobal: true }] } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { tags: true },
    }),
    prisma.trainingSession.findMany({
      where: whereBase,
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 60,
    }),
    prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trainingSession.findMany({
      where: whereBase,
      select: { durationMinutes: true, date: true },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    prisma.goal.findMany({
      where: {
        userId,
        ...(categoryId ? { OR: [{ categoryId }, { categoryId: null }] } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
  ]);

  let streak = 0;
  const uniqueDays = [...new Set(streakSource.map((item) => item.date.toISOString().slice(0, 10)))];

  let cursor = new Date();
  while (true) {
    const day = cursor.toISOString().slice(0, 10);
    if (uniqueDays.includes(day)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const totalHours = recentSessions.reduce((acc, item) => acc + item.durationMinutes, 0) / 60;

  return res.json({
    todayCount,
    weeklyCount,
    recentNotes,
    streak,
    totalHours: Number(totalHours.toFixed(1)),
    goals,
    subscription: latestSubscription ?? { status: 'inactive' },
  });
});

export default router;
