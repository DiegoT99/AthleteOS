import { Router } from 'express';
import { prisma } from '../db/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
  const userId = req.user.userId;

  const sessions = await prisma.trainingSession.findMany({
    where: {
      userId,
      ...(categoryId ? { categoryId } : {}),
    },
    select: {
      date: true,
      durationMinutes: true,
      bodyweightKg: true,
      exercise: true,
      weightKg: true,
      reps: true,
    },
    orderBy: { date: 'asc' },
  });

  const perWeekMap = new Map();
  const heatmap = new Map();
  const strengthProgression = [];
  const weightProgression = [];

  sessions.forEach((session) => {
    const weekKey = `${session.date.getUTCFullYear()}-W${Math.ceil(
      (session.date.getUTCDate() + 6 - ((session.date.getUTCDay() + 6) % 7)) / 7
    )}`;
    const weekEntry = perWeekMap.get(weekKey) ?? { sessions: 0, hours: 0 };
    weekEntry.sessions += 1;
    weekEntry.hours += session.durationMinutes / 60;
    perWeekMap.set(weekKey, weekEntry);

    const dayKey = session.date.toISOString().slice(0, 10);
    heatmap.set(dayKey, (heatmap.get(dayKey) ?? 0) + 1);

    if (session.exercise && session.weightKg && session.reps) {
      const estimatedOneRepMax = session.weightKg * (1 + session.reps / 30);
      strengthProgression.push({
        date: dayKey,
        exercise: session.exercise,
        oneRepMax: Number(estimatedOneRepMax.toFixed(1)),
      });
    }

    if (session.bodyweightKg) {
      weightProgression.push({
        date: dayKey,
        weightKg: session.bodyweightKg,
      });
    }
  });

  const weeklyStats = Array.from(perWeekMap.entries()).map(([week, value]) => ({
    week,
    sessions: value.sessions,
    hours: Number(value.hours.toFixed(1)),
  }));

  return res.json({
    weeklyStats,
    heatmap: Array.from(heatmap.entries()).map(([date, count]) => ({ date, count })),
    strengthProgression,
    weightProgression,
    milestones: {
      totalSessions: sessions.length,
      totalHours: Number(
        sessions.reduce((acc, item) => acc + item.durationMinutes, 0) / 60
      ).toFixed(1),
    },
  });
});

export default router;
