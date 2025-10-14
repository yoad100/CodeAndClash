import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Match } from '../models/match.model';
import { buildLevelBreakpoints, getLevelByRank } from '../services/level.service';

export const getTop = async (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '100', 10);
  const period = (req.query.period as string) || 'all'; // 'all' | 'week' | 'month'

  // Helper: return enriched user objects with rank and level data
  const enrichUsers = async (users: any[]) => {
    const totalPlayers = users.length;
    const breakpoints = buildLevelBreakpoints(totalPlayers);
    return users.map((user: any, idx: number) => {
      const level = getLevelByRank(idx + 1, totalPlayers, breakpoints);
      return {
        ...user,
        rank: idx + 1,
        levelName: level.name,
        levelKey: level.key,
        levelIndex: level.index,
      };
    });
  };
  if (period === 'all') {
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
    return;
  }

  // For weekly/monthly leaderboards we'll rank by wins in the timeframe
  const now = new Date();
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 0;
  if (days <= 0) {
    return res.status(400).json({ message: 'Invalid period' });
  }

  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Prefer rating delta aggregation (sum of rating changes recorded in match.result.ratingChanges)
  const ratingAgg = await Match.aggregate([
    { $match: { finishedAt: { $gte: since }, 'result.ratingChanges': { $exists: true, $ne: [] } } },
    { $unwind: '$result.ratingChanges' },
    { $group: { _id: '$result.ratingChanges.userId', ratingDelta: { $sum: { $subtract: ['$result.ratingChanges.newRating', '$result.ratingChanges.oldRating'] } }, wins: { $sum: { $cond: [{ $eq: ['$result.winnerId', '$result.ratingChanges.userId'] }, 1, 0] } } } },
    { $sort: { ratingDelta: -1 } },
    { $limit: limit },
  ]).exec();

  let agg = ratingAgg;

  // Fallback: if we don't have rating change data (older matches), fall back to wins-based ranking
  if (!agg || agg.length === 0) {
    agg = await Match.aggregate([
      { $match: { finishedAt: { $gte: since }, 'result.winnerId': { $exists: true, $ne: null } } },
      { $group: { _id: '$result.winnerId', wins: { $sum: 1 } } },
      { $sort: { wins: -1 } },
      { $limit: limit },
    ]).exec();
  }

  const ids = agg.map((r: any) => r._id).filter(Boolean);
  // Convert ids to strings and only keep valid ObjectId strings for the DB lookup.
  // Aggregation _id may contain guest ids or other non-ObjectId values; passing
  // those directly to mongoose.find({_id: {$in: ...}}) causes a CastError and can
  // crash the request handler. We therefore filter to valid ObjectIds and
  // safely map unmatched ids to Guest entries later.
  const objectIds = ids.map((id: any) => String(id));
  const validObjectIds = objectIds.filter((id) => mongoose.isValidObjectId(String(id)));
  const users = await User.find({ _id: { $in: validObjectIds } })
    .select('username rating wins losses avatar levelName levelIndex levelKey')
    .lean();

  const userMap = new Map(users.map((u: any) => [String(u._id), u]));

  const enriched = agg.map((entry: any, idx: number) => {
    const idStr = String(entry._id);
    const user = userMap.get(idStr) || { username: 'Guest', rating: 1000, wins: 0, losses: 0, avatar: undefined };
    return {
      ...user,
      periodRatingDelta: typeof entry.ratingDelta === 'number' ? entry.ratingDelta : entry.wins || 0,
      rank: idx + 1,
    };
  });

  res.json({ data: enriched, meta: { totalPlayers: enriched.length } });
};

export const getMyRank = async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  // Ensure the userId is a valid Mongo ObjectId before calling findById.
  // Some clients may send guest ids or other identifiers that are not ObjectId strings
  // — passing those directly to mongoose.findById will throw a CastError and could crash
  // the request handler if uncaught. Validate early and return Unauthorized.
  if (!mongoose.isValidObjectId(String(userId))) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

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
