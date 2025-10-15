import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/user.model';
import { safeFindById } from '../utils/dbHelpers';
import { syncUserLevel, buildLevelBreakpoints } from '../services/level.service';
import { Match } from '../models/match.model';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
  const userId = req.user?.sub as string | undefined;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const user = await safeFindById(User, userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

    console.log('👤 /users/me - User before syncUserLevel:', {
      username: user.username,
      levelName: user.levelName,
      levelKey: user.levelKey,
      levelIndex: user.levelIndex,
    });

  const result = await syncUserLevel(user);
  const { level, totalPlayers } = result;

    console.log('👤 /users/me - After syncUserLevel:', {
      username: user.username,
      computedLevel: { name: level.name, key: level.key, index: level.index },
      userLevel: { name: user.levelName, key: user.levelKey, index: user.levelIndex },
    });

    // strip sensitive fields
    const { _id, username, email, isPremium, rating, wins, losses, avatar, createdAt, updatedAt } = user as any;

    // compute nextRating / progress / isMaxLevel to make header rendering robust
    let nextRating: number | undefined = undefined;
    let progressToNextLevel: number | undefined = undefined;
    let isMaxLevel = false;

    const userRating = typeof user.rating === 'number' ? user.rating : undefined;
    try {
      if (level.index <= 0) {
        isMaxLevel = true;
      } else if (typeof totalPlayers === 'number' && totalPlayers > 0) {
        const breakpoints = buildLevelBreakpoints(totalPlayers);
        const nextTierIndex = Math.max(0, level.index - 1);
        const nextTierLastRank = breakpoints[nextTierIndex];
        if (nextTierLastRank && nextTierLastRank > 0 && totalPlayers >= nextTierLastRank) {
          const cutoff = await User.find({}).sort({ rating: -1, updatedAt: 1 }).skip(Math.max(0, nextTierLastRank - 1)).limit(1).select('rating').lean();
          if (Array.isArray(cutoff) && cutoff.length > 0 && typeof cutoff[0].rating === 'number') {
            // To promote into the next tier, the player needs to strictly exceed
            // the lowest rating currently in that tier. Use lowest + 1 as the cutoff.
            nextRating = cutoff[0].rating + 1;
          }
        }
      }

      if (typeof nextRating === 'number' && typeof userRating === 'number' && nextRating > 0) {
        progressToNextLevel = Math.max(0, Math.min(1, userRating / nextRating));
      }
    } catch (err) {
      console.warn('/users/me nextRating compute failed', err);
    }

    const response = {
      id: _id,
      username,
      email,
      isPremium,
      rating,
      wins,
      losses,
      avatar,
      levelName: level.name,
      levelIndex: level.index,
      levelKey: level.key,
      nextRating,
      progressToNextLevel,
      isMaxLevel,
      createdAt,
      updatedAt,
    };

    console.log('📤 /users/me - Sending response:', {
      username: response.username,
      levelName: response.levelName,
      levelKey: response.levelKey,
      levelIndex: response.levelIndex,
    });

    res.json(response);
  } catch (err) {
    console.error('GET /users/me error', err);
    res.status(500).json({ message: 'Server error' });
  }
});


  // GET /users/me/analytics/subjects
  router.get('/me/analytics/subjects', authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.sub as string | undefined;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const user = await safeFindById(User, userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (!user.isPremium) return res.status(403).json({ message: 'Premium required to access question analytics' });

      // Aggregate matches where the match finished and the answers array contains entries for this user.
      // Use $toString to compare ids so we handle both ObjectId and string stored ids.
      // Pipeline: unwind answers, match by answer.playerId, try to resolve the question reference
      // to extract the authoritative subject from the Question document if available.
      const agg = await Match.aggregate([
        { $match: { finishedAt: { $exists: true, $ne: null } } },
        { $unwind: { path: '$answers', preserveNullAndEmptyArrays: false } },
        { $match: { $expr: { $eq: [ { $toString: '$answers.playerId' }, userId ] } } },
        // Determine the question id referenced by this answer via questionIndex
        { $addFields: { questionId: { $arrayElemAt: ['$questions', '$answers.questionIndex'] } } },
        // Lookup the question document to get its subject (if present)
        { $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'questionDoc'
        } },
        { $addFields: { questionDoc: { $arrayElemAt: ['$questionDoc', 0] } } },
        // Use questionDoc.subject if available, otherwise fall back to match.subject
        { $addFields: { computedSubject: { $ifNull: ['$questionDoc.subject', '$subject'] } } },
        { $group: {
          _id: { subject: { $ifNull: ['$computedSubject', 'unknown'] } },
          correct: { $sum: { $cond: ['$answers.correct', 1, 0] } },
          incorrect: { $sum: { $cond: ['$answers.correct', 0, 1] } },
          total: { $sum: 1 },
        } },
        { $project: { _id: 0, subject: '$_id.subject', correct: 1, incorrect: 1, total: 1 } }
      ]).allowDiskUse(true);

      return res.json({ data: agg });
    } catch (err) {
      console.error('GET /users/me/analytics/subjects error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });
export default router;
