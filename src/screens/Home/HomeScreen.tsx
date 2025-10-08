import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { Button } from '../../components/common/Button';
import { ArcadeButton } from '../../components/fx/ArcadeButton';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';
import { socketService } from '../../services/socket.service';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { RootStackParamList, MainTabParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export const HomeScreen: React.FC = observer(() => {
  const { matchStore, userStore, uiStore } = rootStore;
  type HomeNavProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Home'>,
    StackNavigationProp<RootStackParamList>
  >;

  const navigation = useNavigation<HomeNavProp>();
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const n = await socketService.getQueuedCount();
      if (mounted) setQueued(n);
    };
    refresh();
    const iv = setInterval(refresh, 3000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  const startRandom = () => {
    matchStore.startSearch();
    navigation.navigate('MatchLobby' as any);
  };

  const cancelSearch = () => {
    matchStore.cancelSearch();
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bounces
        alwaysBounceVertical
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Enter the Arena</Text>
        <Text style={styles.subtitle}>Challenge a rival and claim glory!</Text>

        {!matchStore.isSearching ? (
          <ArcadeButton
            title="Find Opponent"
            onPress={startRandom}
            size="lg"
            style={styles.primaryButton}
            showSwords={true}
            isActive={!matchStore.isSearching}
          />
        ) : (
          <ArcadeButton title="Cancel Search" onPress={cancelSearch} variant="ghost" />
        )}

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Premium' as any)} accessibilityRole="button" accessibilityLabel="Go to Premium">
            <Text style={styles.quickTitle}>Premium</Text>
            <Text style={styles.quickSubtitle}>Upgrade</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Ranking' as any)} accessibilityRole="button" accessibilityLabel="Go to Leaderboard">
            <Text style={styles.quickTitle}>Leaderboard</Text>
            <Text style={styles.quickSubtitle}>Top Players</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  contentContainer: { padding: 20, alignItems: 'center', justifyContent: 'center', paddingBottom: 32 },
  primaryButton: { marginVertical: 16 },
  title: { fontSize: 28, color: COLORS.text, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 20 },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  quickCard: { flex: 1, backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: COLORS.secondary },
  quickTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  quickSubtitle: { fontSize: 12, color: COLORS.textSecondary },
});
