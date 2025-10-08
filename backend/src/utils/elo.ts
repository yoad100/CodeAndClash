export function eloRatingChange(rA: number, rB: number, scoreA: number, k = 32) {
  const expectA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  const changeA = Math.round(k * (scoreA - expectA));
  return changeA;
}

export function calculateMatchRatings(
  playerA: { rating: number; score: number },
  playerB: { rating: number; score: number },
  kFactor = 32
) {
  const totalA = playerA.score;
  const totalB = playerB.score;
  
  // Determine match outcome (0 = loss, 0.5 = draw, 1 = win)
  let scoreA: number;
  if (totalA > totalB) scoreA = 1;
  else if (totalA < totalB) scoreA = 0;
  else scoreA = 0.5;
  
  const changeA = eloRatingChange(playerA.rating, playerB.rating, scoreA, kFactor);
  const changeB = -changeA; // Zero-sum
  
  return {
    playerA: {
      oldRating: playerA.rating,
      newRating: Math.max(100, playerA.rating + changeA), // Floor at 100
      change: changeA
    },
    playerB: {
      oldRating: playerB.rating,
      newRating: Math.max(100, playerB.rating + changeB),
      change: changeB
    }
  };
}
