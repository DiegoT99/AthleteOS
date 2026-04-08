import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';

const router = Router();

const createSchema = z.object({
  categoryId: z.string().cuid(),
  techniqueName: z.string().min(2),
  date: z.string(),
  timesDrilled: z.number().int().positive(),
  confidenceLevel: z.number().int().min(1).max(10),
  successRating: z.number().int().min(1).max(10),
  whatImproved: z.string().optional().nullable(),
  whatNeedsWork: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.get('/', async (req, res) => {
  const { categoryId, q } = req.query;

  const logs = await prisma.techniqueLog.findMany({
    where: {
      userId: req.user.userId,
      ...(categoryId ? { categoryId: String(categoryId) } : {}),
      ...(q
        ? {
            OR: [
              { techniqueName: { contains: String(q), mode: 'insensitive' } },
              { notes: { contains: String(q), mode: 'insensitive' } },
              { whatImproved: { contains: String(q), mode: 'insensitive' } },
              { whatNeedsWork: { contains: String(q), mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: { date: 'desc' },
  });

  return res.json(logs);
});

router.get('/progression', async (req, res) => {
  const { categoryId, techniqueName } = req.query;

  const points = await prisma.techniqueLog.findMany({
    where: {
      userId: req.user.userId,
      ...(categoryId ? { categoryId: String(categoryId) } : {}),
      ...(techniqueName
        ? { techniqueName: { contains: String(techniqueName), mode: 'insensitive' } }
        : {}),
    },
    select: {
      date: true,
      techniqueName: true,
      confidenceLevel: true,
      successRating: true,
      timesDrilled: true,
    },
    orderBy: { date: 'asc' },
  });

  return res.json(points);
});

router.post('/', async (req, res) => {
  try {
    const payload = createSchema.parse(req.body);

    const category = await prisma.category.findFirst({
      where: { id: payload.categoryId, userId: req.user.userId },
    });

    if (!category) {
      return res.status(403).json({ message: 'Category not found' });
    }

    const log = await prisma.techniqueLog.create({
      data: {
        ...payload,
        date: new Date(payload.date),
        userId: req.user.userId,
      },
    });

    return res.status(201).json(log);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
