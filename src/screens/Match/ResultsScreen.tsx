import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
let Haptics: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  Haptics = require('expo-haptics');
} catch (e) {
  Haptics = null;
}

const ConfettiBurst: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const pieces = 8;
  const anims = React.useRef(Array.from({ length: pieces }, () => new Animated.Value(0))).current;

  React.useEffect(() => {
    Animated.stagger(30, anims.map((a) => Animated.timing(a, { toValue: 1, duration: 600, useNativeDriver: true }))).start(() => onComplete && onComplete());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((a, i) => {
        const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, -120 - i * 6] });
        const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [0, (i - pieces/2) * 18] });
        const opacity = a;
        const color = ['#FFD700', '#FF6B6B', '#6BCB77', '#4D96FF'][i % 4];
        return (
          <Animated.View key={i} style={{ position: 'absolute', left: '50%', top: '40%', transform: [{ translateX }, { translateY }], opacity }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
          </Animated.View>
        );
      })}
    </View>
  );
};
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../stores/RootStore';
import { ArcadeButton } from '../../components/fx/ArcadeButton';
import { LevelBadge } from '../../components/common/LevelBadge';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getLevelTheme, PLAYER_LEVELS_DESC } from '../../constants/levels';

export const ResultsScreen: React.FC = observer(() => {
  const { matchStore } = rootStore;
  const navigation = useNavigation();
  const players = matchStore.currentMatch?.players || [];
  const winner = matchStore.currentMatch?.winnerId ? players.find((p) => p.id === matchStore.currentMatch?.winnerId) : null;
  const myId = matchStore.myUserId;
  const [showConfetti, setShowConfetti] = React.useState(false);
  const popAnim = React.useRef(new Animated.Value(0.9)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // card pop-in animation
    Animated.parallel([
      Animated.timing(popAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    if (!winner) return;
    if (winner.id === myId) {
      // win
      setShowConfetti(true);
      if (Haptics && Haptics.notificationAsync) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
      }
    } else {
      // lose
      if (Haptics && Haptics.notificationAsync) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (e) {}
      }
    }
  }, [winner?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} nestedScrollEnabled horizontal={false} showsHorizontalScrollIndicator={false}>
      <Animated.View style={[styles.card, { transform: [{ scale: popAnim }] }]}>
        <Text style={styles.emoji}>
          {winner ? (winner.id === myId ? '🏆' : '😅') : '🤝'}
        </Text>
        <Text style={styles.title}>Match Results</Text>

        {winner ? (
          <Text style={styles.winner}>{winner.id === myId ? 'You Win!' : `${winner.username} Wins`}</Text>
        ) : (
          <Text style={styles.winner}>Draw</Text>
        )}

        <View style={styles.scores}>
          {players.map((p) => {
            // Resolve levelKey robustly: prefer levelKey, fall back to levelIndex mapping
            const resolvedLevelKey = p.levelKey ?? (typeof p.levelIndex === 'number' && PLAYER_LEVELS_DESC[p.levelIndex] ? PLAYER_LEVELS_DESC[p.levelIndex].key : undefined);
            const theme = getLevelTheme(resolvedLevelKey);
            const initial = (p.username || 'U')[0]?.toUpperCase?.() || 'U';
            return (
              <View key={p.id} style={styles.scoreRow}>
                <View style={styles.playerLeft}>
                  <LinearGradient colors={[theme.gradient[0] || '#666', theme.gradient[1] || '#444']} style={[styles.avatar, p.id === myId ? styles.avatarYou : undefined]}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </LinearGradient>
                  <View>
                    <Text style={styles.playerName}>{p.id === (myId || '') ? 'You' : p.username}</Text>
                    <View style={styles.badgeSlot}>
                      <LevelBadge levelName={p.levelName} levelKey={resolvedLevelKey} compact />
                    </View>
                  </View>
                </View>
                <Text style={[styles.playerScore, p.id === myId ? styles.playerScoreYou : undefined]}>{p.score}</Text>
              </View>
            );
          })}
        </View>

        {/* Detailed per-question results */}
        <View style={styles.questionsWrap}>
          <Text style={styles.sectionTitle}>Question Review</Text>
          <ScrollView style={styles.questionsList} nestedScrollEnabled>
            {(matchStore.currentMatch?.questions || []).map((q, qi) => {
              const answers = matchStore.currentMatch?.answers || [];
              const correctAnswer = answers.find(a => a.questionIndex === qi && a.correct);
              const correctIndex = typeof (q as any).correctIndex === 'number' ? (q as any).correctIndex : (correctAnswer ? correctAnswer.answerIndex : undefined);
              const correctText = typeof correctIndex === 'number' ? q.choices[correctIndex] : '—';
              const winnerPlayer = correctAnswer ? matchStore.currentMatch?.players.find(p => p.id === correctAnswer.playerId) : undefined;
              return (
                <View key={q.id || qi} style={styles.questionCard}>
                  <Text style={styles.qIndex}>Q{qi + 1}</Text>
                  <Text style={styles.qText} numberOfLines={2}>{q.text}</Text>
                  <View style={styles.questionResultRow}>
                    <Text style={styles.correctLabel}>Answer: <Text style={styles.correctText}>{correctText}</Text></Text>
                    
                  </View>
                  {/* show winner name under the answer */}
                  <View style={styles.winnerBadge}>
                      <Text style={styles.winnerBadgeText}>{winnerPlayer ? (winnerPlayer.id === matchStore.myUserId ? 'You' : winnerPlayer.username) : '—'}</Text>
                    </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
        
        {showConfetti && <ConfettiBurst onComplete={() => setShowConfetti(false)} />}
      </Animated.View>
        </ScrollView>
        {/* Sticky footer with actions */}
        <View style={styles.footer}>
          <ArcadeButton
            title="Play Again"
            size="sm"
            onPress={() => {
              matchStore.resetMatch();
              matchStore.startSearch();
              (navigation as any).navigate('MatchLobby');
            }}
            style={[styles.actionButton, styles.playAgainStretch]}
            textStyle={{ fontSize: 15, fontWeight: '900' }}
          />
        </View>
      </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000090' },
  card: { width: '100%', maxWidth: '100%', backgroundColor: COLORS.cardBackground, borderRadius: 12, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'stretch', borderWidth: 1, borderColor: COLORS.border },
  emoji: { fontSize: 48, marginBottom: 4, textAlign: 'center', alignSelf: 'center' },
  title: { fontSize: 22, color: COLORS.text, fontWeight: 'bold', marginBottom: 4, textAlign: 'center', alignSelf: 'center' },
  winner: { fontSize: 18, color: COLORS.primaryText, marginBottom: 12, textAlign: 'center' },
  scores: { width: '100%', marginTop: 4, marginBottom: 16 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: COLORS.background, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  playerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarYou: { backgroundColor: COLORS.primary },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  avatarGradient: { alignItems: 'center', justifyContent: 'center' },
  playerName: { color: COLORS.text, fontWeight: '600', marginBottom: 2 },
  badgeSlot: { alignSelf: 'flex-start' },
  playerScore: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '700' },
  playerScoreYou: { color: COLORS.primaryText },
  actions: { flexDirection: 'row', marginTop: 4 },
  questionsWrap: { width: '100%', marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  questionsList: { maxHeight: 300 },
  questionCard: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  qIndex: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700', marginBottom: 6 },
  qText: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginBottom: 8 },
  choicesWrap: { marginTop: 6 },
  questionResultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  correctLabel: { color: COLORS.textSecondary, fontSize: 13,marginBottom: 5 },
  correctText: { color: COLORS.correctAnswer, fontWeight: '800' },
  winnerBadge: { backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start', maxWidth: '60%' },
  winnerBadgeText: { color: COLORS.text, fontWeight: '800' },
  choiceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 6, borderRadius: 8 },
  choiceBullet: { width: 22, fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
  choiceText: { flex: 1, color: COLORS.text },
  choicePlayers: { flexDirection: 'row', gap: 6 },
  pickedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 6 },
  pickedBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  pickedBadgeCorrect: { backgroundColor: COLORS.correctAnswer },
  pickedBadgeWrong: { backgroundColor: COLORS.wrongAnswer },
    choiceCorrect: { backgroundColor: 'rgba(34,197,94,0.06)' },
    scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'stretch', paddingVertical: 16, paddingHorizontal: 0 },
    actionButton: { minWidth: 120, paddingVertical: 8 },
    actionButtonGhost: { marginLeft: 8 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 12, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  playAgainStretch: { flex: 1, alignSelf: 'center', marginHorizontal: 10 },
    winnerName: { marginTop: 8, fontSize: 13, color: COLORS.textSecondary, textAlign: 'left' },
});
