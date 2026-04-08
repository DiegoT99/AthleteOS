import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';

const router = Router();

const sessionSchema = z.object({
  categoryId: z.string().cuid(),
  date: z.string(),
  durationMinutes: z.number().int().positive(),
  intensity: z.enum(['low', 'medium', 'high']),
  mood: z.string().optional().nullable(),
  wins: z.string().optional().nullable(),
  needsWork: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  techniquesDrilled: z.array(z.string()).optional(),
  rollingRounds: z.number().int().optional().nullable(),
  positionalTraining: z.string().optional().nullable(),
  submissionsSweeps: z.string().optional().nullable(),
  coachFeedback: z.string().optional().nullable(),
  exercise: z.string().optional().nullable(),
  sets: z.number().int().optional().nullable(),
  reps: z.number().int().optional().nullable(),
  weightKg: z.number().optional().nullable(),
  volume: z.number().optional().nullable(),
  isPr: z.boolean().optional(),
  bodyweightKg: z.number().optional().nullable(),
  rounds: z.number().int().optional().nullable(),
  combos: z.string().optional().nullable(),
  drills: z.string().optional().nullable(),
  sparring: z.boolean().optional().nullable(),
  cardioMinutes: z.number().int().optional().nullable(),
});

const assertCategoryOwnership = async (userId, categoryId) => {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  return Boolean(category);
};

router.get('/', async (req, res) => {
  const { categoryId } = req.query;

  const sessions = await prisma.trainingSession.findMany({
    where: {
      userId: req.user.userId,
      ...(categoryId ? { categoryId: String(categoryId) } : {}),
    },
    orderBy: { date: 'desc' },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return res.json(sessions);
});

router.post('/', async (req, res) => {
  try {
    const payload = sessionSchema.parse(req.body);

    const ownsCategory = await assertCategoryOwnership(req.user.userId, payload.categoryId);
    if (!ownsCategory) {
      return res.status(403).json({ message: 'Category not found' });
    }

    const session = await prisma.trainingSession.create({
      data: {
        ...payload,
        date: new Date(payload.date),
        userId: req.user.userId,
      },
    });

    return res.status(201).json(session);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = sessionSchema.partial().parse(req.body);

    if (payload.categoryId) {
      const ownsCategory = await assertCategoryOwnership(req.user.userId, payload.categoryId);
      if (!ownsCategory) {
        return res.status(403).json({ message: 'Category not found' });
      }
    }

    const existing = await prisma.trainingSession.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const updated = await prisma.trainingSession.update({
      where: { id: req.params.id },
      data: {
        ...payload,
        ...(payload.date ? { date: new Date(payload.date) } : {}),
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const existing = await prisma.trainingSession.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
  });

  if (!existing) {
    return res.status(404).json({ message: 'Session not found' });
  }

  await prisma.trainingSession.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Session deleted' });
});

export default router;
