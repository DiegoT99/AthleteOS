import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.user.userId },
    orderBy: [{ isCustom: 'asc' }, { name: 'asc' }],
  });

  return res.json(categories);
});

router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  });

  try {
    const payload = schema.parse(req.body);
    const category = await prisma.category.create({
      data: {
        ...payload,
        userId: req.user.userId,
        isCustom: true,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
