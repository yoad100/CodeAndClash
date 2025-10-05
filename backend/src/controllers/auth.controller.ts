import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '900s';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, passwordHash: hash });

  const accessToken = (jwt.sign as any)({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = (jwt.sign as any)({ sub: user.id }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

  await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) });

  res.json({ accessToken, refreshToken, user: { id: user.id, username: user.username } });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = (jwt.sign as any)({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = (jwt.sign as any)({ sub: user.id }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

  await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) });

  res.json({ accessToken, refreshToken, user: { id: user.id, username: user.username } });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });

  try {
  const payload: any = (jwt.verify as any)(refreshToken, JWT_SECRET);
    const stored = await RefreshToken.findOne({ userId: payload.sub, token: refreshToken });
    if (!stored) return res.status(401).json({ message: 'Invalid token' });

  const accessToken = (jwt.sign as any)({ sub: payload.sub }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const newRefresh = (jwt.sign as any)({ sub: payload.sub }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

    stored.token = newRefresh;
    stored.expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    await stored.save();

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(204).send();

  await RefreshToken.deleteOne({ token: refreshToken });
  res.status(204).send();
};
