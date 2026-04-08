import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { DEFAULT_CATEGORIES } from '../constants.js';
import {
  generateResetToken,
  hashResetToken,
  signToken,
} from '../utils.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        categories: {
          create: DEFAULT_CATEGORIES.map((category) => ({
            ...category,
            isCustom: false,
          })),
        },
      },
    });

    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 14);

    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: 'trialing',
        stripeCustomerId: `pending_${user.id}`,
        trialStart,
        trialEnd,
        currentPeriodStart: trialStart,
        currentPeriodEnd: trialEnd,
      },
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post('/logout', (req, res) => {
  return res.json({ message: 'Logged out' });
});

router.post('/password-reset/request', async (req, res) => {
  const schema = z.object({ email: z.string().email() });

  try {
    const { email } = schema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ message: 'If account exists, reset instructions were generated.' });
    }

    const rawToken = generateResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return res.json({
      message: 'Reset token generated (basic implementation).',
      resetToken: rawToken,
      expiresAt,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post('/password-reset/confirm', async (req, res) => {
  const schema = z.object({
    token: z.string().min(20),
    newPassword: z.string().min(8),
  });

  try {
    const { token, newPassword } = schema.parse(req.body);
    const tokenHash = hashResetToken(token);

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt ||
      resetRecord.expiresAt < new Date()
    ) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      name: true,
      gymTeam: true,
      rankBelt: true,
      weightClass: true,
      profileImageUrl: true,
      preferredCategoryIds: true,
    },
  });

  return res.json(user);
});

export default router;
