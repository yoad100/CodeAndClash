import { useStores } from '../contexts/StoreContext';

export const useMatch = () => {
  const { matchStore } = useStores();

  return {
    currentMatch: matchStore.currentMatch,
    isSearching: matchStore.isSearching,
    currentQuestion: matchStore.currentQuestion,
    timeRemaining: matchStore.timeRemaining,
    myPlayer: matchStore.myPlayer,
    opponentPlayer: matchStore.opponentPlayer,
    canSubmitAnswer: matchStore.canSubmitAnswer,
    startSearch: matchStore.startSearch.bind(matchStore),
    cancelSearch: matchStore.cancelSearch.bind(matchStore),
    submitAnswer: matchStore.submitAnswer.bind(matchStore),
    leaveMatch: matchStore.leaveMatch.bind(matchStore),
  };
};
