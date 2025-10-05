export const formatTimeRemaining = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const calculateRatingChange = (
  playerRating: number,
  opponentRating: number,
  didWin: boolean,
  kFactor: number = 32
): number => {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actualScore = didWin ? 1 : 0;
  return Math.round(kFactor * (actualScore - expectedScore));
};

export const getWinRate = (wins: number, totalMatches: number): number => {
  if (totalMatches === 0) return 0;
  return Math.round((wins / totalMatches) * 100);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout !== null) clearTimeout(timeout as any);
    timeout = globalThis.setTimeout(() => func(...args), wait);
  };
};
