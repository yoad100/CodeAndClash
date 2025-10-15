import { Match } from '../models/match.model';
import { User } from '../models/user.model';
import { Question } from '../models/question.model';
import { calculateMatchRatings } from '../utils/elo';
import { updateScore } from './leaderboard.redis';
import { syncUserLevel } from './level.service';
import logger from '../logger';
import { safeFindById } from '../utils/dbHelpers';

export class MatchService {
  async createMatch(playerIds: string[], subject?: string) {
    // Load random questions
    const filter: any = {};
    if (subject && subject !== 'any') filter.subject = subject;
    
    const total = await Question.countDocuments(filter);
    const skip = Math.max(0, Math.floor(Math.random() * Math.max(1, total - 5)));
    const questions = await Question.find(filter).skip(skip).limit(5).lean();
    
    if (questions.length === 0) {
      throw new Error('No questions available for the selected subject');
    }
    
  // Get player usernames (filter-only valid object ids when querying DB)
  const validPlayerIds = playerIds.filter((p) => typeof p === 'string');
  const users = await User.find({ _id: { $in: validPlayerIds } }).select('username');
  const userMap = new Map(users.map(u => [String(u._id), u.username]));
    
    const players = playerIds.map(id => ({
      userId: id,
      username: userMap.get(id) || 'Unknown',
      score: 0
    }));
    
    const match = await Match.create({
      players,
      subject: subject === 'any' ? undefined : subject,
      questions: questions.map(q => q._id),
      status: 'inprogress',
      startedAt: new Date(),
    });
    
    return {
      match,
      questionData: questions.map(q => ({
        id: q._id,
        correctIndex: q.correctIndex
      }))
    };
  }
  
  async endMatch(matchId: string, forcedWinnerId?: string) {
    const match = await Match.findById(matchId);
    if (!match || match.status === 'finished') {
      throw new Error('Match not found or already finished');
    }
    
    const players = match.players as any[];
    const scores = Object.fromEntries(
      players.map(p => [String(p.userId), p.score || 0])
    );
    
    let winnerId: string | null = null;
    
    if (forcedWinnerId) {
      winnerId = String(forcedWinnerId);
    } else {
      // Determine winner by score
      const [player1, player2] = players;
      const score1 = scores[String(player1.userId)] || 0;
      const score2 = scores[String(player2.userId)] || 0;
      
      if (score1 > score2) winnerId = String(player1.userId);
      else if (score2 > score1) winnerId = String(player2.userId);
      // else it's a draw (winnerId remains null)
    }
    
    // Update match
    match.status = 'finished';
    match.finishedAt = new Date();
    match.result = { winnerId, scores };
    await match.save();
    
    // Update player ratings and stats
    await this.updatePlayerStats(players, winnerId);
    
    return {
      match,
      winnerId,
      scores,
      players: players.map(p => ({
        id: String(p.userId),
        userId: String(p.userId),
        username: p.username,
        score: p.score || 0
      }))
    };
  }
  
  private async updatePlayerStats(players: any[], winnerId: string | null) {
    if (players.length !== 2) return; // Only handle 1v1 for now
    
    const [player1, player2] = players;
    
    // Only update real users (not guests)
    const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(String(s));
    
    const updates = [];
    
    for (const player of players) {
  if (!isObjectId(String(player.userId))) continue;

  const user = await safeFindById(User, player.userId);
      if (!user) continue;
      
      const isWinner = String(player.userId) === String(winnerId);
      const isLoser = winnerId && String(player.userId) !== String(winnerId);
      
      // Update win/loss counts
      if (isWinner) {
        user.wins = (user.wins || 0) + 1;
      } else if (isLoser) {
        user.losses = (user.losses || 0) + 1;
      }
      
      updates.push({ user, player, isWinner });
    }
    
    // Calculate rating changes based on level-aware delta (gap rule)
    if (updates.length === 2) {
      const [update1, update2] = updates;
      try {
        const winnerIdStr = winnerId ? String(winnerId) : null;
        const uAIndex = typeof update1.user.levelIndex === 'number' ? update1.user.levelIndex : undefined;
        const uBIndex = typeof update2.user.levelIndex === 'number' ? update2.user.levelIndex : undefined;
        const winnerIsA = winnerIdStr && String(update1.user._id) === winnerIdStr;
        let deltaA = 0;
        let deltaB = 0;
        if (winnerIsA) {
          const d = require('./level.service').calculateLevelAwareRatingDelta(uAIndex, uBIndex);
          deltaA = d;
          deltaB = -d;
        } else if (winnerIdStr) {
          const d = require('./level.service').calculateLevelAwareRatingDelta(uBIndex, uAIndex);
          deltaB = d;
          deltaA = -d;
        } else {
          // draw: no rating change
          deltaA = 0;
          deltaB = 0;
        }

        const oldA = typeof update1.user.rating === 'number' ? update1.user.rating : 1000;
        const oldB = typeof update2.user.rating === 'number' ? update2.user.rating : 1000;
        update1.user.rating = Math.max(100, oldA + deltaA);
        update2.user.rating = Math.max(100, oldB + deltaB);

        logger.info('Rating changes (level-gap): %s (%d->%d) vs %s (%d->%d)',
          update1.user.username, oldA, update1.user.rating,
          update2.user.username, oldB, update2.user.rating
        );
      } catch (e) {
        logger.warn('Failed to compute level-gap rating changes, falling back to no-op: %o', e);
      }
    }
    
    // Save user updates and update leaderboard
    for (const update of updates) {
      await update.user.save();
      await updateScore(String(update.user._id), update.user.rating);

      // Immediately sync user level after rating change; persist only if it actually changed
      try {
        const res = await syncUserLevel(update.user, { persist: true });
        if (res && res.level) {
          logger.info('User %s level sync result: %s (rank: %d of %d)', update.user.username, res.level.name, res.rank, res.totalPlayers);
        }
      } catch (err) {
        logger.warn('Failed to sync user level for %s: %o', String(update.user._id), err);
      }
    }
  }
}