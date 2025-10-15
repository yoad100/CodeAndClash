import { User } from '../models/user.model';
import logger from '../logger';

export interface LevelBadgeTheme {
  gradient: [string, string];
  border: string;
  glow: string;
  text: string;
  shimmer?: string;
}

export interface LevelDefinition {
  name: string;
  key: string;
  index: number;
  badge: LevelBadgeTheme;
}

export interface LevelComputationResult {
  level: LevelDefinition;
  rank: number;
  totalPlayers: number;
}

export const PLAYER_LEVELS_DESC: LevelDefinition[] = [
  {
    name: 'Master',
    key: 'master',
    index: 0,
    badge: {
      gradient: ['#fed7aa', '#f97316'],
      border: '#fb923c',
      glow: 'rgba(249, 115, 22, 0.45)',
      text: '#2b1102',
      shimmer: 'rgba(253, 186, 116, 0.65)',
    },
  },
  {
    name: 'Guru',
    key: 'guru',
    index: 1,
    badge: {
      gradient: ['#c4b5fd', '#7c3aed'],
      border: '#8b5cf6',
      glow: 'rgba(124, 58, 237, 0.45)',
      text: '#1e0b4b',
      shimmer: 'rgba(196, 181, 253, 0.7)',
    },
  },
  {
    name: 'Distinguished',
    key: 'distinguished',
    index: 2,
    badge: {
      gradient: ['#93c5fd', '#2563eb'],
      border: '#3b82f6',
      glow: 'rgba(37, 99, 235, 0.45)',
      text: '#0b1b3f',
      shimmer: 'rgba(147, 197, 253, 0.6)',
    },
  },
  {
    name: 'Staff',
    key: 'staff',
    index: 3,
    badge: {
      gradient: ['#a7f3d0', '#059669'],
      border: '#10b981',
      glow: 'rgba(5, 150, 105, 0.45)',
      text: '#023021',
      shimmer: 'rgba(167, 243, 208, 0.6)',
    },
  },
  {
    name: 'Principal',
    key: 'principal',
    index: 4,
    badge: {
      gradient: ['#f9a8d4', '#db2777'],
      border: '#ec4899',
      glow: 'rgba(219, 39, 119, 0.45)',
      text: '#3f071f',
      shimmer: 'rgba(249, 168, 212, 0.65)',
    },
  },
  {
    name: 'Architect',
    key: 'architect',
    index: 5,
    badge: {
      gradient: ['#fde68a', '#ca8a04'],
      border: '#fbbf24',
      glow: 'rgba(202, 138, 4, 0.45)',
      text: '#382403',
      shimmer: 'rgba(253, 230, 138, 0.7)',
    },
  },
  {
    name: 'Expert',
    key: 'expert',
    index: 6,
    badge: {
      gradient: ['#bfdbfe', '#1d4ed8'],
      border: '#2563eb',
      glow: 'rgba(29, 78, 216, 0.3)',
      text: '#0a1f4d',
      shimmer: 'rgba(191, 219, 254, 0.6)',
    },
  },
  {
    name: 'Lead',
    key: 'lead',
    index: 7,
    badge: {
      gradient: ['#fde68a', '#d97706'],
      border: '#f59e0b',
      glow: 'rgba(217, 119, 6, 0.35)',
      text: '#3b1d02',
      shimmer: 'rgba(253, 216, 138, 0.55)',
    },
  },
  {
    name: 'Senior',
    key: 'senior',
    index: 8,
    badge: {
      gradient: ['#bbf7d0', '#16a34a'],
      border: '#22c55e',
      glow: 'rgba(22, 163, 74, 0.35)',
      text: '#052910',
      shimmer: 'rgba(187, 247, 208, 0.55)',
    },
  },
  {
    name: 'Specialist',
    key: 'specialist',
    index: 9,
    badge: {
      gradient: ['#fbcfe8', '#be185d'],
      border: '#f472b6',
      glow: 'rgba(190, 24, 93, 0.35)',
      text: '#44071e',
      shimmer: 'rgba(251, 207, 232, 0.6)',
    },
  },
  {
    name: 'Mid-level',
    key: 'mid',
    index: 10,
    badge: {
      gradient: ['#fee2e2', '#dc2626'],
      border: '#ef4444',
      glow: 'rgba(220, 38, 38, 0.3)',
      text: '#470707',
      shimmer: 'rgba(254, 226, 226, 0.5)',
    },
  },
  {
    name: 'Junior',
    key: 'junior',
    index: 11,
    badge: {
      gradient: ['#e0f2fe', '#0284c7'],
      border: '#38bdf8',
      glow: 'rgba(2, 132, 199, 0.3)',
      text: '#082f49',
      shimmer: 'rgba(224, 242, 254, 0.5)',
    },
  },
  {
    name: 'Intern',
    key: 'intern',
    index: 12,
    badge: {
      gradient: ['#f3f4f6', '#9ca3af'],
      border: '#d1d5db',
      glow: 'rgba(156, 163, 175, 0.3)',
      text: '#1f2937',
      shimmer: 'rgba(243, 244, 246, 0.45)',
    },
  },
];

const LEVEL_COUNT = PLAYER_LEVELS_DESC.length;
export const DEFAULT_LEVEL = PLAYER_LEVELS_DESC[LEVEL_COUNT - 1];
const LEVEL_WEIGHTS_ASC = PLAYER_LEVELS_DESC.map((_, index) => index + 1);
const LEVEL_WEIGHT_TOTAL = LEVEL_WEIGHTS_ASC.reduce((sum, weight) => sum + weight, 0);

export function buildLevelBreakpoints(totalPlayers: number): number[] {
  if (totalPlayers <= 0) {
    return new Array(LEVEL_COUNT).fill(0);
  }

  // If we have fewer players than levels, assign top players to distinct tiers
  if (totalPlayers <= LEVEL_COUNT) {
    const breakpoints: number[] = [];
    let running = 0;
    for (let i = 0; i < LEVEL_COUNT; i++) {
      if (i < totalPlayers) {
        running += 1;
      }
      breakpoints.push(running);
    }
    return breakpoints;
  }

  const rawCounts = LEVEL_WEIGHTS_ASC.map((weight) => (weight / LEVEL_WEIGHT_TOTAL) * totalPlayers);
  const counts = rawCounts.map((value) => Math.floor(value));

  let allocated = counts.reduce((sum, value) => sum + value, 0);
  let remaining = totalPlayers - allocated;

  if (remaining > 0) {
    for (let i = 0; i < LEVEL_COUNT && remaining > 0; i++) {
      if (counts[i] === 0) {
        counts[i] = 1;
        remaining -= 1;
      }
    }
  }

  if (remaining > 0) {
    const fractionalOrder = rawCounts
      .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
      .sort((a, b) => {
        if (b.remainder === a.remainder) {
          return a.index - b.index;
        }
        return b.remainder - a.remainder;
      });

    for (const entry of fractionalOrder) {
      if (remaining <= 0) break;
      counts[entry.index] += 1;
      remaining -= 1;
    }
  }

  if (remaining > 0) {
    counts[counts.length - 1] += remaining;
  }

  const breakpoints: number[] = [];
  counts.reduce((sum, value, index) => {
    const next = sum + value;
    breakpoints[index] = next;
    return next;
  }, 0);

  return breakpoints;
}

export function getLevelByRank(rank: number, totalPlayers: number, breakpoints?: number[]): LevelDefinition {
  if (totalPlayers <= 0) {
    return PLAYER_LEVELS_DESC[LEVEL_COUNT - 1];
  }

  if (totalPlayers <= LEVEL_COUNT) {
    const index = Math.min(Math.max(rank - 1, 0), LEVEL_COUNT - 1);
    return PLAYER_LEVELS_DESC[index];
  }

  const tiers = breakpoints && breakpoints.length === LEVEL_COUNT
    ? breakpoints
    : buildLevelBreakpoints(totalPlayers);

  const normalizedRank = Math.max(1, Math.min(rank, totalPlayers));
  const index = tiers.findIndex((threshold) => normalizedRank <= threshold);
  return PLAYER_LEVELS_DESC[index === -1 ? LEVEL_COUNT - 1 : index];
}

export function calculateLevelAwareRatingDelta(
  winnerLevelIndex: number | undefined,
  loserLevelIndex: number | undefined
): number {
  // If we don't know levels, give a small default reward
  if (winnerLevelIndex == null || loserLevelIndex == null) {
    return 2;
  }
  // Reward equals the gap between levels (absolute difference).
  // Example: Intern(index=12) beats Master(index=0) -> gap=12 -> reward=12.
  const gap = Math.abs(winnerLevelIndex - loserLevelIndex);
  // If same level, keep a small default reward
  if (gap === 0) return 2;
  // If winner is a higher tier (smaller index) beating a lower-tier opponent, give small reward
  if (winnerLevelIndex < loserLevelIndex) {
    return 1;
  }
  // Otherwise (lower-tier beating higher-tier), reward equals the gap
  return gap;
}

export async function computeLevelForRating(rating: number): Promise<LevelComputationResult> {
  const safeRating = typeof rating === 'number' ? rating : 1000;
  const [totalPlayers, higherRated] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ rating: { $gt: safeRating } }),
  ]);

  if (totalPlayers <= 0) {
    return { level: DEFAULT_LEVEL, rank: 0, totalPlayers: 0 };
  }

  const breakpoints = buildLevelBreakpoints(totalPlayers);
  const rank = Math.min(totalPlayers, higherRated + 1);
  const level = getLevelByRank(rank, totalPlayers, breakpoints);
  return { level, rank, totalPlayers };
}

export async function syncUserLevel(user: any, options?: { persist?: boolean }): Promise<LevelComputationResult> {
  if (!user) {
    return { level: DEFAULT_LEVEL, rank: 0, totalPlayers: 0 };
  }

  const result = await computeLevelForRating(typeof user.rating === 'number' ? user.rating : 1000);
  const { level } = result;

  const hasChanged =
    user.levelKey !== level.key ||
    user.levelIndex !== level.index ||
    user.levelName !== level.name;

  if (hasChanged) {
    user.levelName = level.name;
    user.levelKey = level.key;
    user.levelIndex = level.index;
    if ('levelUpdatedAt' in user) {
      user.levelUpdatedAt = new Date();
    }

    if (options?.persist !== false) {
      if (typeof user.save === 'function') {
        await user.save();
      } else if (user._id) {
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              levelName: level.name,
              levelKey: level.key,
              levelIndex: level.index,
              levelUpdatedAt: new Date(),
            },
          }
        );
      }
    }
  }

  return result;
}

export async function recalculateAllUserLevels(): Promise<void> {
  const users = await User.find({}).sort({ rating: -1, updatedAt: 1 }).select('_id rating levelName levelIndex levelKey');
  if (!users.length) {
    logger.info('Level refresh skipped — no users found');
    return;
  }
  const total = users.length;
  const breakpoints = buildLevelBreakpoints(total);
  const bulkOps: any[] = [];

  users.forEach((user, idx) => {
    const levelDef = getLevelByRank(idx + 1, total, breakpoints);
    const levelName = levelDef.name;
    const newIndex = levelDef.index;
    const currentName = (user as any).levelName;
    const currentIndex = (user as any).levelIndex;
    const currentKey = (user as any).levelKey;

    if (currentName !== levelName || currentIndex !== newIndex || currentKey !== levelDef.key) {
      bulkOps.push({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              levelName,
              levelIndex: newIndex,
              levelKey: levelDef.key,
              levelUpdatedAt: new Date(),
            },
          },
        },
      });
    }
  });

  if (bulkOps.length) {
    await User.bulkWrite(bulkOps);
    logger.info('Updated %d user levels', bulkOps.length);
  } else {
    logger.info('Level refresh completed — no changes necessary');
  }
}
