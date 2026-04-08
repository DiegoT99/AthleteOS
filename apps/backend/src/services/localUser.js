import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';
import { DEFAULT_CATEGORIES } from '../constants.js';

const getEmailFromStackUser = (stackUser) =>
  stackUser?.primaryEmail ||
  stackUser?.primaryEmailAddress ||
  stackUser?.email ||
  stackUser?.contactChannels?.find((channel) => channel.type === 'email')?.value ||
  null;

const getNameFromStackUser = (stackUser, fallbackEmail) =>
  stackUser?.displayName ||
  stackUser?.name ||
  (fallbackEmail ? fallbackEmail.split('@')[0] : 'Athlete');

export const ensureLocalUserFromStack = async (stackUser) => {
  if (!stackUser?.id) {
    throw new Error('Invalid Stack user');
  }

  const email = getEmailFromStackUser(stackUser);
  if (!email) {
    throw new Error('Stack user email not found');
  }

  const name = getNameFromStackUser(stackUser, email);

  const byStackId = await prisma.user.findUnique({
    where: { stackAuthId: stackUser.id },
  });

  if (byStackId) {
    const updated = await prisma.user.update({
      where: { id: byStackId.id },
      data: {
        email,
        name,
      },
    });
    return updated;
  }

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    const linked = await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        stackAuthId: stackUser.id,
        name,
      },
    });
    return linked;
  }

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

  const created = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      stackAuthId: stackUser.id,
      categories: {
        create: DEFAULT_CATEGORIES.map((category) => ({
          ...category,
          isCustom: false,
        })),
      },
    },
  });

  await prisma.subscription.create({
    data: {
      userId: created.id,
      status: 'inactive',
      stripeCustomerId: `pending_${created.id}`,
    },
  });

  return created;
};