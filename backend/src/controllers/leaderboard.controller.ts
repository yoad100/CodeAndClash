import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { buildLevelBreakpoints, getLevelByRank } from '../services/level.service';

export const getTop = async (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '100', 10);
  const [count, users] = await Promise.all([
    User.countDocuments({}),
    User.find({})
      .sort({ rating: -1 })
      .limit(limit)
      .select('username rating wins losses avatar levelName levelIndex levelKey')
      .lean(),
  ]);

  const totalPlayers = count > 0 ? count : users.length;
  const breakpoints = buildLevelBreakpoints(totalPlayers);

  const enriched = users.map((user, idx) => {
    const level = getLevelByRank(idx + 1, totalPlayers, breakpoints);
    return {
      ...user,
      rank: idx + 1,
      levelName: level.name,
      levelKey: level.key,
      levelIndex: level.index,
    };
  });

  res.json({ data: enriched, meta: { totalPlayers } });
};

export const getMyRank = async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const [count, my] = await Promise.all([
    User.countDocuments({}),
    User.findById(userId).select('username rating wins losses avatar levelName levelIndex levelKey').lean(),
  ]);
  if (!my) return res.status(404).json({ message: 'User not found' });

  // Count how many users have rating greater than this user
  const rank = await User.countDocuments({ rating: { $gt: my.rating } });
  const totalPlayers = count > 0 ? count : rank + 1;
  const breakpoints = buildLevelBreakpoints(totalPlayers);
  const level = getLevelByRank(rank + 1, totalPlayers, breakpoints);

  res.json({
    data: {
      user: {
        ...my,
        levelName: level.name,
        levelKey: level.key,
        levelIndex: level.index,
      },
      rank: rank + 1,
    },
    meta: { totalPlayers },
  });
};
