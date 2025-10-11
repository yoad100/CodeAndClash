import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
// guard haptics import - may not be installed in this environment
let Haptics: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics');
} catch (e) {
  Haptics = null;
}
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';
import { socketService } from '../../services/socket.service';
import { VsSplash } from '../../components/match/VsSplash';
import { FreezeOverlayMobile } from '../../components/fx/FreezeOverlayMobile';

const MatchScreenComponent: React.FC = () => {
  const { matchStore, uiStore, userStore } = rootStore;
  const navigation = useNavigation();
  const q = matchStore.currentQuestion;
  // Allow answering based solely on game state; offline answers will be queued by socketService
  const canAnswer = matchStore.canSubmitAnswer;
  const [pressedIndex, setPressedIndex] = React.useState<number | null>(null);
  const lastResult = matchStore.lastAnswerResult;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const cardShake = React.useRef(new Animated.Value(0)).current;
  const cardPulse = React.useRef(new Animated.Value(1)).current;
  const scorePopOpacity = React.useRef(new Animated.Value(0)).current;
  const scorePopScale = React.useRef(new Animated.Value(0.8)).current;
  const sparkAnim = React.useRef(new Animated.Value(1)).current; // 1 = hidden
  const urgentPulseRef = React.useRef<Animated.CompositeAnimation | null>(null);
  const comboOpacity = React.useRef(new Animated.Value(0)).current;
  const comboScale = React.useRef(new Animated.Value(0.9)).current;
  const [queuedSet, setQueuedSet] = React.useState<Record<string, boolean>>({});
  const [showVs, setShowVs] = React.useState(true);

  const onChoose = (index: number) => {
    // Race condition bypass: If I'm not frozen but canAnswer is false,
    // still allow the click and let submitAnswer handle the retry logic
    const myUserId = matchStore.myUserId;
    const isFrozen = myUserId ? matchStore.frozen[myUserId] : true;
    
    if (!canAnswer && isFrozen) {
      return; // Only block if actually frozen
    }
    
    // prevent re-choosing an eliminated (wrong) choice
    if (matchStore.disabledChoicesForCurrentQuestion.has(index)) return;
    // micro spark effect
    sparkAnim.setValue(0);
    Animated.timing(sparkAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    setPressedIndex(index);
    matchStore.submitAnswer(matchStore.currentQuestionIndex, index);
    // haptic feedback
    if (Haptics && Haptics.impactAsync) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) { /* ignore */ }
    }
    // clear optimistic pressed after a short delay
    setTimeout(() => setPressedIndex(null), 1500);
  };

  React.useEffect(() => {
    if (!lastResult) return;
    // flash animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // If my answer was wrong, shake the question card
    const isMine = lastResult.playerId === matchStore.myUserId;
    if (isMine && !lastResult.correct) {
      cardShake.setValue(0);
      Animated.sequence([
        Animated.timing(cardShake, { toValue: 1, duration: 40, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }

    // If my answer was correct on this question, show score pop badge
    if (isMine && lastResult.correct && lastResult.questionIndex === matchStore.currentQuestionIndex) {
      scorePopOpacity.setValue(0);
      scorePopScale.setValue(0.8);
      Animated.parallel([
        Animated.timing(scorePopOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(scorePopScale, { toValue: 1.15, duration: 140, useNativeDriver: true }),
          Animated.timing(scorePopScale, { toValue: 1, duration: 140, useNativeDriver: true })
        ])
      ]).start(() => {
        Animated.timing(scorePopOpacity, { toValue: 0, delay: 500, duration: 220, useNativeDriver: true }).start();
      });
      // Animate combo badge when it increases (only show at 2+)
      if ((matchStore.myCombo || 0) >= 2) {
        comboOpacity.setValue(0);
        comboScale.setValue(0.9);
        Animated.parallel([
          Animated.timing(comboOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(comboScale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
            Animated.timing(comboScale, { toValue: 1.0, duration: 150, useNativeDriver: true })
          ])
        ]).start();
      }
    }
  }, [lastResult]);

  // Pulse animation for active turn
  React.useEffect(() => {
    if (canAnswer && matchStore.myPlayerStatus === 'can-answer') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [canAnswer, matchStore.myPlayerStatus]);

  // poll queued items to show badge overlay on queued choices
  React.useEffect(() => {
    let mounted = true;
    const refreshQueue = async () => {
      try {
        const q = await socketService.getQueuedItems();
        if (!mounted) return;
        const map: Record<string, boolean> = {};
        q.forEach((it: any) => {
          map[`${it.questionIndex}:${it.answerIndex}`] = true;
        });
        setQueuedSet(map);
      } catch (e) {
        // ignore
      }
    };
    refreshQueue();
    const iv = setInterval(refreshQueue, 1000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  // Low timer pulse on the whole question card when idle timer gets urgent
  React.useEffect(() => {
    const urgent = matchStore.timeRemaining <= 10 && matchStore.timeRemaining > 0;
    if (urgent) {
      if (!urgentPulseRef.current) {
        urgentPulseRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(cardPulse, { toValue: 1.03, duration: 500, useNativeDriver: true }),
            Animated.timing(cardPulse, { toValue: 1.0, duration: 500, useNativeDriver: true })
          ])
        );
        urgentPulseRef.current.start();
      }
    } else {
      if (urgentPulseRef.current) {
        urgentPulseRef.current.stop();
        urgentPulseRef.current = null;
      }
      cardPulse.setValue(1);
    }
    return () => {
      if (urgentPulseRef.current && (matchStore.timeRemaining <= 0 || matchStore.timeRemaining > 10)) {
        urgentPulseRef.current.stop();
        urgentPulseRef.current = null;
      }
    };
  }, [matchStore.timeRemaining, matchStore.currentQuestionIndex]);
  
  // Debug freeze countdown
  React.useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('🧊 Freeze Debug:', {
        myFreezeCountdown: matchStore.myFreezeCountdown,
        myUserId: matchStore.myUserId,
        freezeCountdowns: matchStore.freezeCountdowns,
        frozen: matchStore.frozen
      });
    }
  }, [matchStore.myFreezeCountdown]);
  
  // Show VS splash only when entering the match for the first time
  React.useEffect(() => {
    if (matchStore.currentQuestionIndex === 0 && matchStore.currentMatch?.status === 'active') {
      // hide it after the short animation
      setShowVs(false);
    }
  }, [matchStore.currentQuestionIndex, matchStore.currentMatch?.status]);

  // Safety: if match ended, navigate to Results screen (in case store-level navigation didn't trigger)
  React.useEffect(() => {
    if (matchStore.currentMatch && matchStore.currentMatch.status === 'ended') {
      try { (navigation as any).navigate('Results'); } catch (e) { /* ignore */ }
    }
  }, [matchStore.currentMatch?.status]);

  const myFreezeCountdown = matchStore.myFreezeCountdown ?? 0;
  const showFreezeOverlay = myFreezeCountdown > 0;
  const freezeDuration = matchStore.myFreezeTotalDuration ?? undefined;
  const freezePlayerName =
    matchStore.myPlayer?.username ||
    userStore?.user?.username ||
    matchStore.currentMatch?.players?.find((p) => p.id === matchStore.myUserId)?.username ||
    'You';

  if (!matchStore.currentMatch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>No active match</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {showVs && matchStore.myPlayer && matchStore.opponentPlayer && (
        <VsSplash leftName={matchStore.myPlayer.username} rightName={matchStore.opponentPlayer.username} onDone={() => setShowVs(false)} />
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        bounces
        alwaysBounceVertical
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <View style={styles.playerContainer}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerLabel}>You</Text>
            <Text style={styles.playerScore}>{matchStore.myPlayer?.score ?? 0}</Text>
          </View>
          {matchStore.myCombo >= 2 && (
            <Animated.View style={[styles.comboBadge, { opacity: comboOpacity, transform: [{ scale: comboScale }] }]}
              pointerEvents="none"
            >
              <Text style={styles.comboText}>COMBO x{matchStore.myCombo}</Text>
            </Animated.View>
          )}
          <View style={[
            styles.statusIndicator, 
            matchStore.myPlayerStatus === 'can-answer' && styles.statusActive,
            matchStore.myPlayerStatus === 'frozen' && styles.statusFrozen,
            matchStore.myPlayerStatus === 'waiting' && styles.statusWaiting
          ]}>
            <Text style={styles.statusText}>
              {matchStore.myPlayerStatus === 'can-answer' ? '🎯' : 
               matchStore.myPlayerStatus === 'frozen' ? '❄️' : 
               matchStore.myPlayerStatus === 'waiting' ? '⏳' : '⭕'}
            </Text>
          </View>
        </View>
        
        <View style={styles.playerContainer}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerLabel}>Opponent</Text>
            <Text style={styles.playerScore}>{matchStore.opponentPlayer?.score ?? 0}</Text>
          </View>
          <View style={[
            styles.statusIndicator, 
            matchStore.opponentPlayerStatus === 'can-answer' && styles.statusActive,
            matchStore.opponentPlayerStatus === 'frozen' && styles.statusFrozen,
            matchStore.opponentPlayerStatus === 'waiting' && styles.statusWaiting
          ]}>
            <Text style={styles.statusText}>
              {matchStore.opponentPlayerStatus === 'can-answer' ? '🎯' : 
               matchStore.opponentPlayerStatus === 'frozen' ? '❄️' : 
               matchStore.opponentPlayerStatus === 'waiting' ? '⏳' : '⭕'}
            </Text>
          </View>
        </View>
      </View>

      {/* Turn Indicator Banner */}
      <Animated.View style={[
        styles.turnBanner,
        matchStore.myPlayerStatus === 'can-answer' && styles.turnBannerActive,
        matchStore.myPlayerStatus === 'frozen' && matchStore.opponentPlayerStatus === 'can-answer' && styles.turnBannerOpponent,
        { transform: [{ scale: matchStore.myPlayerStatus === 'can-answer' ? pulseAnim : 1 }] }
      ]}>
        <Text style={styles.turnText}>{matchStore.turnIndicatorMessage}</Text>
      </Animated.View>

      <Animated.View style={[
        styles.questionCard, 
        { transform: [
          { translateX: cardShake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) },
          { scale: cardPulse }
        ] }
      ]}>
        <Text style={styles.questionText}>{q ? q.text : 'Waiting for question...'}</Text>
        {q && q.choices.map((c: string, idx: number) => (
          <Animated.View key={idx} style={{ transform: [{ scale: pressedIndex === idx ? 0.98 : scaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.choice,
                matchStore.isAnswerDisabled(matchStore.currentQuestionIndex) && styles.choiceDisabled,
                matchStore.disabledChoicesForCurrentQuestion.has(idx) && styles.choiceEliminated,
                pressedIndex === idx && styles.choicePressed,
                // Add generic turn status early so result highlights can override
                !matchStore.isAnswerDisabled(matchStore.currentQuestionIndex) && matchStore.myPlayerStatus === 'can-answer' && styles.choiceAvailable,
                matchStore.isAnswerDisabled(matchStore.currentQuestionIndex) && matchStore.myPlayerStatus === 'frozen' && styles.choiceFrozen,
                // Show already answered state
                matchStore.answeredQuestions.has(matchStore.currentQuestionIndex) && styles.choiceDisabled,
                // Show my answer result (correct only on the picked choice)
                lastResult && lastResult.playerId === matchStore.myUserId && lastResult.correct && lastResult.questionIndex === matchStore.currentQuestionIndex && lastResult.answerIndex === idx && styles.choiceCorrect,
                lastResult && lastResult.playerId === matchStore.myUserId && !lastResult.correct && lastResult.answerIndex === idx && lastResult.questionIndex === matchStore.currentQuestionIndex && styles.choiceIncorrect,
                // Show opponent's pick (yellow if wrong, green if correct)
                lastResult && lastResult.playerId !== matchStore.myUserId && lastResult.answerIndex === idx && lastResult.questionIndex === matchStore.currentQuestionIndex && (lastResult.correct ? styles.choiceOpponentCorrect : styles.choiceOpponentWrong),
              ]}
              onPress={() => onChoose(idx)}
              disabled={matchStore.isAnswerDisabled(matchStore.currentQuestionIndex) || matchStore.disabledChoicesForCurrentQuestion.has(idx)}
              accessibilityRole="button"
              accessibilityLabel={`Choice ${idx + 1}: ${c}`}
            >
              {/* spark tap effect */}
              {pressedIndex === idx && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.spark,
                    {
                      opacity: Animated.subtract(1, sparkAnim),
                      transform: [{ scale: Animated.add(0.6, Animated.multiply(sparkAnim, 1.2)) }]
                    }
                  ]}
                />
              )}
              {/* Show an indicator only on my active turn container (not on every choice) */}
              {/* Removed per-choice ✓ to avoid implying all are correct */}
              
              {/* queued badge overlay */}
              {queuedSet[`${matchStore.currentQuestionIndex}:${idx}`] && (
                <View style={styles.queuedBadge} accessible accessibilityLabel="Answer is queued">
                  <Text style={styles.queuedBadgeText}>•</Text>
                </View>
              )}

              {/* eliminated choice badge */}
              {matchStore.disabledChoicesForCurrentQuestion.has(idx) && (
                <View style={styles.eliminatedRibbon} accessible accessibilityLabel="Eliminated choice">
                  <Text style={styles.eliminatedRibbonText}>ELIMINATED</Text>
                </View>
              )}

              {/* score pop badge on my correct choice */}
              {lastResult && lastResult.correct && lastResult.playerId === matchStore.myUserId && lastResult.answerIndex === idx && lastResult.questionIndex === matchStore.currentQuestionIndex && (
                <Animated.View style={[styles.scorePop, { opacity: scorePopOpacity, transform: [{ scale: scorePopScale }] }]}
                  pointerEvents="none"
                  accessibilityElementsHidden
                >
                  <Text style={styles.scorePopText}>+1</Text>
                </Animated.View>
              )}
              
              <Text style={[ 
                styles.choiceText,
                (pressedIndex === idx || (lastResult && lastResult.playerId === matchStore.myUserId && lastResult.questionIndex === matchStore.currentQuestionIndex && lastResult.answerIndex === idx)) ? { color: COLORS.white } : undefined,
                // Adjust text color based on choice state
                !matchStore.isAnswerDisabled(matchStore.currentQuestionIndex) && matchStore.myPlayerStatus === 'can-answer' ? { color: COLORS.text } : undefined,
                matchStore.isAnswerDisabled(matchStore.currentQuestionIndex) ? { color: COLORS.textSecondary } : undefined,
                matchStore.disabledChoicesForCurrentQuestion.has(idx) ? styles.choiceEliminatedText : undefined,
              ]}>{c}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.timerContainer}>
          <Text style={[
            styles.timer, 
            matchStore.timeRemaining <= 10 && styles.timerUrgent
          ]}>
            {matchStore.timeRemaining <= 10 ? '⚠️ ' : ''}Match idle: {matchStore.timeRemaining}s
          </Text>
          {matchStore.timeRemaining <= 10 && (
            <Text style={styles.urgentMessage}>Match will end soon!</Text>
          )}
        </View>

        {/* Remaining choices counter */}
        {q && (
          <Text style={styles.remainingChoices}>Remaining choices: {q.choices.length - matchStore.disabledChoicesForCurrentQuestion.size}</Text>
        )}
        
        {uiStore.connectionStatus !== 'connected' && (
          <Text style={styles.queueHint}>Queued answers will be sent when reconnected</Text>
        )}
        
        {!matchStore.canSubmitAnswer && matchStore.myPlayerStatus === 'frozen' && (
          <Text style={styles.frozenMessage}>You're frozen - wait for next question</Text>
        )}
      </View>

      </ScrollView>

      {/* Debug overlay */}
      {true && (
        <View style={{ position: 'absolute', bottom: 4, left: 4, right: 4, backgroundColor: '#00000090', padding: 8, borderRadius: 6 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>DEBUG FREEZE STATE:</Text>
          <Text style={{ color: '#fff', fontSize: 11 }}>
            Frozen: {JSON.stringify(matchStore.frozen)}
          </Text>
          <Text style={{ color: '#fff', fontSize: 11 }}>
            My Status: {matchStore.myPlayerStatus} | Opp Status: {matchStore.opponentPlayerStatus}
          </Text>
          <Text style={{ color: '#fff', fontSize: 11 }}>
            My Countdown: {matchStore.myFreezeCountdown} | Opp Countdown: {matchStore.opponentFreezeCountdown}
          </Text>
          <Text style={{ color: '#fff', fontSize: 11 }}>
            Can Answer: {matchStore.canSubmitAnswer ? 'YES' : 'NO'} | Timer: {matchStore.timeRemaining}s
          </Text>
          <Text style={{ color: '#ddd', fontSize: 10 }} numberOfLines={2}>
            Last Events: {matchStore.debugLastEvents.slice(0,2).map(e => `${e.event}(${JSON.stringify(e.payload)})`).join(' | ')}
          </Text>
        </View>
      )}
      
      {/* Freeze overlay with snowfall and countdown ring */}
      {showFreezeOverlay && (
        <FreezeOverlayMobile
          timeLeft={myFreezeCountdown}
          totalDuration={freezeDuration}
          playerName={freezePlayerName}
        />
      )}
    </SafeAreaView>
  );
};

export const MatchScreen = observer(MatchScreenComponent);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  content: { padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 },
  title: { fontSize: 22, color: COLORS.text, fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  playerContainer: { flexDirection: 'row', alignItems: 'center' },
  playerInfo: { alignItems: 'center', marginRight: 8 },
  playerLabel: { fontSize: 12, color: COLORS.textSecondary },
  playerScore: { fontSize: 20, color: COLORS.text, fontWeight: '700' },
  statusIndicator: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: COLORS.border, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  statusActive: { backgroundColor: COLORS.success, borderColor: COLORS.glowCyan },
  statusFrozen: { backgroundColor: COLORS.error, borderColor: COLORS.glowPink },
  statusWaiting: { backgroundColor: COLORS.warning, borderColor: COLORS.glowPrimary },
  statusText: { fontSize: 16 },
  
  turnBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border
  },
  turnBannerActive: { 
    backgroundColor: COLORS.success + '20', 
    borderColor: COLORS.secondary 
  },
  turnBannerOpponent: { 
    backgroundColor: COLORS.warning + '20', 
    borderColor: COLORS.primary 
  },
  turnText: { 
    fontSize: 14, 
    color: COLORS.text, 
    textAlign: 'center', 
    fontWeight: '600' 
  },
  
  questionCard: { margin: 16, padding: 16, backgroundColor: COLORS.cardBackground, borderRadius: 12 },
  questionText: { fontSize: 18, color: COLORS.text, marginBottom: 12 },
  choice: { 
    padding: 12, 
    backgroundColor: COLORS.background, 
    borderRadius: 8, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    position: 'relative'
  },
  choiceDisabled: { opacity: 0.6 },
  choicePressed: { backgroundColor: COLORS.primary, borderColor: COLORS.secondary },
  choiceCorrect: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  choiceIncorrect: { backgroundColor: COLORS.error, borderColor: COLORS.glowPink },
  choiceEliminated: { 
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
    borderColor: '#dc2626',
    shadowColor: '#f87171',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  choiceOpponentWrong: { backgroundColor: COLORS.warning + '40', borderColor: COLORS.primary },
  choiceOpponentCorrect: { backgroundColor: COLORS.success + '30', borderColor: COLORS.secondary },
  choiceAvailable: { 
    borderColor: COLORS.primary, 
    borderWidth: 2,
    backgroundColor: COLORS.primary + '10' 
  },
  choiceFrozen: { 
    borderColor: COLORS.error, 
    backgroundColor: COLORS.error + '20',
    opacity: 0.4
  },
  choiceActiveIndicator: {
    position: 'absolute',
    top: 6,
    left: 8,
    backgroundColor: COLORS.success,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  choiceActiveText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  choiceText: { color: COLORS.text, fontSize: 16 },
  
  footer: { padding: 16, alignItems: 'center' },
  timerContainer: { alignItems: 'center', marginBottom: 8 },
  timer: { fontSize: 18, color: COLORS.textSecondary, fontWeight: '600' },
  idleTimer: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
  timerUrgent: { color: COLORS.error, fontSize: 20, fontWeight: 'bold' },
  urgentMessage: { fontSize: 12, color: COLORS.error, marginTop: 4, fontWeight: '600' },
  queueHint: { fontSize: 12, color: COLORS.warning, textAlign: 'center', marginBottom: 4 },
  frozenMessage: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', fontStyle: 'italic' },
  
  queuedBadge: { 
    position: 'absolute', 
    top: 6, 
    right: 8, 
    backgroundColor: COLORS.warning, 
    width: 18, 
    height: 18, 
    borderRadius: 9, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  queuedBadgeText: { color: COLORS.white, fontSize: 12, lineHeight: 12 },
  eliminatedRibbon: {
    position: 'absolute',
    top: -10,
    right: -12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#dc2626',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    transform: [{ rotate: '6deg' }],
    shadowColor: '#7f1d1d',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  eliminatedRibbonText: {
    color: '#fff5f5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  choiceEliminatedText: {
    color: '#fee2e2',
    textDecorationLine: 'line-through',
    textShadowColor: 'rgba(220,38,38,0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  remainingChoices: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },

  // spark micro effect overlay
  spark: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.glowCyan,
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  // score pop badge
  scorePop: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.glowPrimary,
  },
  scorePopText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  comboBadge: {
    marginLeft: 8,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.glowPrimary,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comboText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
    textShadowColor: COLORS.glowCyan,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: 1,
  },
});
