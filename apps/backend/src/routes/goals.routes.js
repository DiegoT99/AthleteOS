import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';

const router = Router();

const goalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  targetValue: z.number().optional().nullable(),
  currentValue: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
});

router.get('/', async (req, res) => {
  const { categoryId } = req.query;

  const goals = await prisma.goal.findMany({
    where: {
      userId: req.user.userId,
      ...(categoryId ? { categoryId: String(categoryId) } : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
  });

  return res.json(goals);
});

router.post('/', async (req, res) => {
  try {
    const payload = goalSchema.parse(req.body);

    if (payload.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: payload.categoryId, userId: req.user.userId },
      });

      if (!category) {
        return res.status(403).json({ message: 'Category not found' });
      }
    }

    const goal = await prisma.goal.create({
      data: {
        userId: req.user.userId,
        ...payload,
        deadline: payload.deadline ? new Date(payload.deadline) : null,
      },
    });

    return res.status(201).json(goal);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = goalSchema.partial().parse(req.body);

    const goal = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (payload.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: payload.categoryId, userId: req.user.userId },
      });
      if (!category) {
        return res.status(403).json({ message: 'Category not found' });
      }
    }

    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: {
        ...payload,
        ...(payload.deadline ? { deadline: new Date(payload.deadline) } : {}),
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
