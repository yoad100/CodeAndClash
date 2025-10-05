export function eloRatingChange(rA: number, rB: number, scoreA: number, k = 32) {
  const expectA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  const changeA = Math.round(k * (scoreA - expectA));
  return changeA;
}
