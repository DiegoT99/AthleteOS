import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { parseDateRange } from '../utils.js';

const router = Router();

const noteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  categoryId: z.string().cuid().optional().nullable(),
  isGlobal: z.boolean().optional(),
  pinned: z.boolean().optional(),
  tags: z.array(z.string().min(1)).default([]),
});

router.get('/', async (req, res) => {
  const { q, tag, categoryId, from, to, pinned } = req.query;
  const dateRange = parseDateRange(from, to);

  const notes = await prisma.note.findMany({
    where: {
      userId: req.user.userId,
      ...(typeof pinned !== 'undefined' ? { pinned: pinned === 'true' } : {}),
      ...(categoryId
        ? { categoryId: String(categoryId) }
        : { OR: [{ isGlobal: true }, { categoryId: null }, { categoryId: { not: null } }] }),
      ...(dateRange ? { createdAt: dateRange } : {}),
      ...(tag ? { tags: { some: { tag: String(tag) } } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: String(q), mode: 'insensitive' } },
              { content: { contains: String(q), mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      tags: true,
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
  });

  return res.json(notes);
});

router.post('/', async (req, res) => {
  try {
    const payload = noteSchema.parse(req.body);

    if (payload.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: payload.categoryId, userId: req.user.userId },
      });
      if (!category) {
        return res.status(403).json({ message: 'Category not found' });
      }
    }

    const note = await prisma.note.create({
      data: {
        userId: req.user.userId,
        title: payload.title,
        content: payload.content,
        categoryId: payload.isGlobal ? null : payload.categoryId ?? null,
        isGlobal: payload.isGlobal ?? false,
        pinned: payload.pinned ?? false,
        tags: {
          create: payload.tags.map((tag) => ({ tag: tag.toLowerCase().trim() })),
        },
      },
      include: { tags: true },
    });

    return res.status(201).json(note);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = noteSchema.partial().parse(req.body);

    const note = await prisma.note.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (payload.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: payload.categoryId, userId: req.user.userId },
      });
      if (!category) {
        return res.status(403).json({ message: 'Category not found' });
      }
    }

    if (payload.tags) {
      await prisma.noteTag.deleteMany({ where: { noteId: note.id } });
    }

    const updated = await prisma.note.update({
      where: { id: note.id },
      data: {
        ...(payload.title ? { title: payload.title } : {}),
        ...(payload.content ? { content: payload.content } : {}),
        ...(typeof payload.pinned === 'boolean' ? { pinned: payload.pinned } : {}),
        ...(typeof payload.isGlobal === 'boolean' ? { isGlobal: payload.isGlobal } : {}),
        ...(typeof payload.categoryId !== 'undefined'
          ? { categoryId: payload.isGlobal ? null : payload.categoryId }
          : {}),
        ...(payload.tags
          ? {
              tags: {
                create: payload.tags.map((tag) => ({ tag: tag.toLowerCase().trim() })),
              },
            }
          : {}),
      },
      include: { tags: true },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
  });

  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }

  await prisma.note.delete({ where: { id: note.id } });
  return res.json({ message: 'Note deleted' });
});

export default router;
