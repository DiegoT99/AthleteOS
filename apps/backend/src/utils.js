import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const signToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

export const hashResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const generateResetToken = () => crypto.randomBytes(32).toString('hex');

export const parseDateRange = (from, to) => {
  const range = {};

  if (from || to) {
    range.gte = from ? new Date(from) : undefined;
    range.lte = to ? new Date(to) : undefined;
  }

  return Object.keys(range).length ? range : undefined;
};
