export interface LevelTheme {
  key: string;
  name: string;
  gradient: readonly [string, string, ...string[]];
  border: string;
  glow: string;
  text: string;
  shimmer: string;
  accent: string;
  icon: string;
  particleColors: string[];
  beam: string;
  tier: number;
}

const BASE_LEVELS: Array<Omit<LevelTheme, 'tier'>> = [
  {
    key: 'master',
    name: 'Master',
    gradient: ['#fff7d6', '#fde047', '#fb923c', '#ea580c'] as const,
    border: 'rgba(250,204,21,0.9)',
    glow: 'rgba(250,204,21,0.55)',
    text: '#2b1102',
    shimmer: 'rgba(255,236,179,0.95)',
    accent: 'rgba(254,215,102,0.85)',
    icon: 'planet',
    particleColors: ['rgba(250,204,21,0.75)', 'rgba(253,186,116,0.85)', 'rgba(255,255,255,0.65)'],
    beam: 'rgba(253,224,71,0.45)',
  },
  {
    key: 'guru',
    name: 'Guru',
    gradient: ['#ede9fe', '#c4b5fd', '#8b5cf6', '#7c3aed'] as const,
    border: 'rgba(139,92,246,0.85)',
    glow: 'rgba(124,58,237,0.55)',
    text: '#1e0b4b',
    shimmer: 'rgba(221,214,254,0.8)',
    accent: 'rgba(167,139,250,0.75)',
    icon: 'sparkles',
    particleColors: ['rgba(124,58,237,0.55)', 'rgba(196,181,253,0.75)', 'rgba(236,233,254,0.6)'],
    beam: 'rgba(167,139,250,0.38)',
  },
  {
    key: 'distinguished',
    name: 'Distinguished',
    gradient: ['#e0f2fe', '#93c5fd', '#60a5fa', '#2563eb'] as const,
    border: 'rgba(59,130,246,0.75)',
    glow: 'rgba(37,99,235,0.45)',
    text: '#0b1b3f',
    shimmer: 'rgba(191,219,254,0.75)',
    accent: 'rgba(96,165,250,0.7)',
    icon: 'shield-checkmark',
    particleColors: ['rgba(37,99,235,0.55)', 'rgba(96,165,250,0.6)', 'rgba(224,242,254,0.5)'],
    beam: 'rgba(96,165,250,0.32)',
  },
  {
    key: 'staff',
    name: 'Staff',
    gradient: ['#bbf7d0', '#6ee7b7', '#34d399', '#059669'] as const,
    border: 'rgba(16,185,129,0.75)',
    glow: 'rgba(5,150,105,0.45)',
    text: '#023021',
    shimmer: 'rgba(167,243,208,0.7)',
    accent: 'rgba(52,211,153,0.65)',
    icon: 'leaf',
    particleColors: ['rgba(34,197,94,0.5)', 'rgba(167,243,208,0.55)', 'rgba(187,247,208,0.5)'],
    beam: 'rgba(52,211,153,0.28)',
  },
  {
    key: 'principal',
    name: 'Principal',
    gradient: ['#fbcfe8', '#f472b6', '#ec4899', '#db2777'] as const,
    border: 'rgba(236,72,153,0.75)',
    glow: 'rgba(219,39,119,0.45)',
    text: '#3f071f',
    shimmer: 'rgba(249,168,212,0.75)',
    accent: 'rgba(244,114,182,0.6)',
    icon: 'rose',
    particleColors: ['rgba(236,72,153,0.55)', 'rgba(253,164,175,0.55)', 'rgba(244,114,182,0.45)'],
    beam: 'rgba(244,114,182,0.32)',
  },
  {
    key: 'architect',
    name: 'Architect',
    gradient: ['#ecfeff', '#99f6e4', '#5eead4', '#0ea5a4'] as const,
    border: 'rgba(14,165,164,0.78)',
    glow: 'rgba(14,165,164,0.42)',
    text: '#053230',
    shimmer: 'rgba(217,249,249,0.8)',
    accent: 'rgba(6,182,212,0.6)',
    icon: 'aperture',
    particleColors: ['rgba(6,182,212,0.6)', 'rgba(34,197,94,0.38)', 'rgba(217,249,249,0.32)'],
    beam: 'rgba(6,182,212,0.28)',
  },
  {
    key: 'expert',
    name: 'Expert',
    // Yellow / gold palette for Expert
    gradient: ['#fff7d6', '#fde68a', '#f59e0b', '#f97316'] as const,
    border: 'rgba(245,158,11,0.9)',
    glow: 'rgba(245,158,11,0.5)',
    text: '#2b1206',
    shimmer: 'rgba(255,244,214,0.95)',
    accent: 'rgba(245,158,11,0.9)',
    icon: 'diamond',
    particleColors: ['rgba(250,204,21,0.75)', 'rgba(253,224,71,0.6)', 'rgba(255,255,255,0.5)'],
    beam: 'rgba(250,204,21,0.34)',
  },
  {
    key: 'lead',
    name: 'Lead',
    gradient: ['#fff7ed', '#fed7aa', '#fb923c', '#ea580c'] as const,
    border: 'rgba(245,158,11,0.65)',
    glow: 'rgba(217,119,6,0.35)',
    text: '#3b1d02',
    shimmer: 'rgba(253,216,138,0.55)',
    accent: 'rgba(245,158,11,0.5)',
    icon: 'flame',
    particleColors: ['rgba(249,115,22,0.45)', 'rgba(253,186,116,0.45)', 'rgba(253,230,138,0.42)'],
    beam: 'rgba(253,186,116,0.2)',
  },
  {
    key: 'senior',
    name: 'Senior',
    gradient: ['#fbfde7', '#eefcc7', '#d9f08a', '#5a8a16'] as const,
    border: 'rgba(90,138,22,0.72)',
    glow: 'rgba(90,138,22,0.36)',
    text: '#14320b',
    shimmer: 'rgba(241,255,224,0.62)',
    accent: 'rgba(90,138,22,0.55)',
    icon: 'ribbon',
    particleColors: ['rgba(90,138,22,0.48)', 'rgba(190,230,120,0.42)', 'rgba(230,255,200,0.34)'],
    beam: 'rgba(167,219,99,0.24)',
  },
  {
    key: 'specialist',
    name: 'Specialist',
    gradient: ['#fff5f6', '#ffdbe6', '#ff9bad', '#db2777'] as const,
    border: 'rgba(219,39,119,0.72)',
    glow: 'rgba(219,39,119,0.36)',
    text: '#3b0427',
    shimmer: 'rgba(255,230,240,0.62)',
    accent: 'rgba(219,39,119,0.5)',
    icon: 'flower',
    particleColors: ['rgba(219,39,119,0.45)', 'rgba(255,123,168,0.42)', 'rgba(255,210,230,0.36)'],
    beam: 'rgba(245,130,170,0.2)',
  },
  {
    key: 'mid',
    name: 'Mid-level',
    gradient: ['#fef2f2', '#fee2e2', '#fca5a5', '#dc2626'] as const,
    border: 'rgba(248,113,113,0.6)',
    glow: 'rgba(220,38,38,0.28)',
    text: '#470707',
    shimmer: 'rgba(254,226,226,0.5)',
    accent: 'rgba(252,165,165,0.4)',
    icon: 'flame-outline',
    particleColors: ['rgba(248,113,113,0.32)', 'rgba(252,165,165,0.3)', 'rgba(254,226,226,0.28)'],
    beam: 'rgba(252,165,165,0.16)',
  },
  {
    key: 'junior',
    name: 'Junior',
    gradient: ['#f0f9ff', '#e0f2fe', '#7dd3fc', '#0284c7'] as const,
    border: 'rgba(56,189,248,0.55)',
    glow: 'rgba(2,132,199,0.26)',
    text: '#082f49',
    shimmer: 'rgba(224,242,254,0.5)',
    accent: 'rgba(125,211,252,0.38)',
    icon: 'water',
    particleColors: ['rgba(14,165,233,0.3)', 'rgba(125,211,252,0.28)', 'rgba(224,242,254,0.24)'],
    beam: 'rgba(125,211,252,0.14)',
  },
  {
    key: 'intern',
    name: 'Intern',
    gradient: ['#f3f4f6', '#e2e8f0', '#cbd5f5', '#9ca3af'] as const,
    border: 'rgba(148,163,184,0.55)',
    glow: 'rgba(148,163,184,0.25)',
    text: '#1f2937',
    shimmer: 'rgba(243,244,246,0.45)',
    accent: 'rgba(203,213,225,0.32)',
    icon: 'ellipse-outline',
    particleColors: ['rgba(148,163,184,0.24)', 'rgba(203,213,225,0.22)', 'rgba(226,232,240,0.2)'],
    beam: 'rgba(203,213,225,0.12)',
  },
];

export const PLAYER_LEVELS_DESC: LevelTheme[] = BASE_LEVELS.map((level, tier) => ({ ...level, tier }));

const themeByKey = new Map(PLAYER_LEVELS_DESC.map((level) => [level.key, level] as const));
const LEVEL_COUNT = PLAYER_LEVELS_DESC.length;
const LEVEL_WEIGHTS_ASC = PLAYER_LEVELS_DESC.map((_, index) => index + 1);
const LEVEL_WEIGHT_TOTAL = LEVEL_WEIGHTS_ASC.reduce((sum, weight) => sum + weight, 0);

export function getLevelTheme(levelKey?: string, fallbackKey = 'intern'): LevelTheme {
  if (levelKey && themeByKey.has(levelKey)) {
    return themeByKey.get(levelKey)!;
  }
  return themeByKey.get(fallbackKey) || PLAYER_LEVELS_DESC[PLAYER_LEVELS_DESC.length - 1];
}

export function getLevelDisplay(levelName?: string, levelKey?: string) {
  const theme = getLevelTheme(levelKey);
  return {
    ...theme,
    name: levelName || theme.name,
  };
}

export function buildLevelBreakpoints(totalPlayers: number): number[] {
  if (totalPlayers <= 0) {
    return new Array(LEVEL_COUNT).fill(0);
  }

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

export function getLevelByRank(rank: number, totalPlayers: number, breakpoints?: number[]): LevelTheme {
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
