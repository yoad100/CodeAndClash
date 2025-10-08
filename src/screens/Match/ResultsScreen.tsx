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
import { Button } from '../../components/common/Button';
import { rootStore } from '../../stores/RootStore';
import { ArcadeButton } from '../../components/fx/ArcadeButton';

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
          {players.map((p) => (
            <View key={p.id} style={styles.scoreRow}>
              <View style={styles.playerLeft}>
                <View style={[styles.avatar, p.id === myId ? styles.avatarYou : undefined]}>
                  <Text style={styles.avatarText}>{(p.username || 'U')[0]?.toUpperCase?.() || 'U'}</Text>
                </View>
                <Text style={styles.playerName}>{p.id === (myId || '') ? 'You' : p.username}</Text>
              </View>
              <Text style={[styles.playerScore, p.id === myId ? styles.playerScoreYou : undefined]}>{p.score}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <ArcadeButton title="Play Again" onPress={() => { 
            matchStore.resetMatch(); 
            matchStore.startSearch(); 
            (navigation as any).navigate('MatchLobby'); 
          }} />
          <ArcadeButton 
            title="Home" 
            onPress={() => { 
              matchStore.resetMatch(); 
              (navigation as any).navigate('Main', { 
                screen: 'Home', 
                params: { screen: 'HomeRoot' } 
              }); 
            }} 
            variant="ghost" 
            style={{ marginLeft: 12 }} 
          />
        </View>
        {showConfetti && <ConfettiBurst onComplete={() => setShowConfetti(false)} />}
      </Animated.View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000090' },
  card: { width: '88%', maxWidth: 520, backgroundColor: COLORS.cardBackground, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  emoji: { fontSize: 48, marginBottom: 4 },
  title: { fontSize: 22, color: COLORS.text, fontWeight: 'bold', marginBottom: 4 },
  winner: { fontSize: 18, color: COLORS.primary, marginBottom: 12 },
  scores: { width: '100%', marginTop: 4, marginBottom: 16 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: COLORS.background, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  playerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarYou: { backgroundColor: COLORS.primary },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  playerName: { color: COLORS.text, fontWeight: '600' },
  playerScore: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '700' },
  playerScoreYou: { color: COLORS.primary },
  actions: { flexDirection: 'row', marginTop: 4 },
});
