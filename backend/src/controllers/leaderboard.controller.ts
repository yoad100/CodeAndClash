import { Request, Response } from 'express';
import { User } from '../models/user.model';

export const getTop = async (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '100', 10);
  const users = await User.find({}).sort({ rating: -1 }).limit(limit).select('username rating wins losses avatar').lean();
  res.json({ data: users });
};

export const getMyRank = async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const my = await User.findById(userId).select('username rating wins losses avatar').lean();
  if (!my) return res.status(404).json({ message: 'User not found' });

  // Count how many users have rating greater than this user
  const rank = await User.countDocuments({ rating: { $gt: my.rating } });
  res.json({ data: { user: my, rank: rank + 1 } });
};
