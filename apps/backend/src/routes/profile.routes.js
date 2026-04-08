import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';

const router = Router();

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  profileImageUrl: z
    .string()
    .refine(
      (value) => {
        if (/^https?:\/\//i.test(value)) {
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        }
        return /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value);
      },
      { message: 'profileImageUrl must be a valid URL or image data URL' }
    )
    .nullable()
    .optional(),
  gymTeam: z.string().nullable().optional(),
  rankBelt: z.string().nullable().optional(),
  weightClass: z.string().nullable().optional(),
  preferredCategoryIds: z.array(z.string().cuid()).optional(),
});

router.get('/', async (req, res) => {
  const profile = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      name: true,
      profileImageUrl: true,
      gymTeam: true,
      rankBelt: true,
      weightClass: true,
      preferredCategoryIds: true,
    },
  });

  return res.json(profile);
});

router.put('/', async (req, res) => {
  try {
    const payload = profileSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: payload,
      select: {
        id: true,
        email: true,
        name: true,
        profileImageUrl: true,
        gymTeam: true,
        rankBelt: true,
        weightClass: true,
        preferredCategoryIds: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
