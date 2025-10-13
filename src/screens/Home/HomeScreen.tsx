import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image as RNImage, ScrollView, Animated, Easing, Dimensions } from 'react-native';
import { SmartImage } from '../../components/common/SmartImage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
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
        <SmartImage
          primary={() => require('../../../assets/Code&ClashLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
          <AnimatedTouchableCard title="Premium" subtitle="Upgrade and perks" icon={<Ionicons name="diamond" size={20} color={COLORS.primary} />} onPress={() => navigation.navigate('Premium' as any)} />
            <AnimatedTouchableCard title="Leaderboard" subtitle="Top players & stats" icon={<Ionicons name="trophy" size={20} color={COLORS.primary} />} onPress={() => navigation.navigate('Ranking' as any)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const AnimatedTouchableCard: React.FC<{ title: string; subtitle: string; icon?: React.ReactNode; onPress: () => void }> = ({ title, subtitle, icon, onPress }) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.timing(scale, { toValue: 0.98, duration: 120, useNativeDriver: true, easing: Easing.out(Easing.quad) }).start();
  const onPressOut = () => Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true, easing: Easing.in(Easing.quad) }).start();

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }], marginHorizontal: 6 }}>
      <TouchableOpacity activeOpacity={0.85} style={styles.richTouchable} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} accessibilityRole="button">
        <View style={styles.richCard}>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  primaryButton: { marginVertical: 16 },
  title: { fontSize: 28, color: COLORS.text, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 20, textAlign: 'center' },
  logo: { width: '60%', height: '60%', marginBottom: (0-30), marginTop: (0-50), alignSelf: 'center' },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  richTouchable: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 6,
  },
  richCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    height: 64,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ffffff18',
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardIcon: { width: 20, height: 20, tintColor: COLORS.textSecondary, opacity: 0.85 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, flexWrap: 'wrap' },
  cardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, flexWrap: 'wrap' },
});
