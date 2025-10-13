import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';
import { apiService } from '../../services/api.service';
import { LeaderboardEntry } from '../../types/user.types';
import { LevelBadge } from '../../components/common/LevelBadge';

export const RankingScreen: React.FC = observer(() => {
  const { userStore, uiStore } = rootStore;
  const user = userStore.user;
  const derivedRank = React.useMemo(() => {
    if (userStore.userRank > 0) {
      return userStore.userRank;
    }
    if (!user) return null;
    const index = userStore.leaderboard.findIndex((entry) => entry.username === user.username);
    return index >= 0 ? index + 1 : null;
  }, [userStore.userRank, userStore.leaderboard, user]);

  const [period, setPeriod] = React.useState<'all'|'week'|'month'>('all');
  const [lists, setLists] = React.useState<{ all: LeaderboardEntry[]; week: any[]; month: any[] }>({ all: [], week: [], month: [] });
  const [loadingMap, setLoadingMap] = React.useState<{ all: boolean; week: boolean; month: boolean }>({ all: true, week: false, month: false });

  // Rank within the currently selected period (all/week/month)
  const periodRank = React.useMemo(() => {
    const list = period === 'all' ? lists.all : period === 'week' ? lists.week : lists.month;
    if (!user || !list || !list.length) return null;
    const idx = list.findIndex((entry: any) => entry.username === user.username);
    return idx >= 0 ? idx + 1 : null;
  }, [period, lists, user]);

  // Prefer the period-specific rank (including 'all') when available; fall back to the global derivedRank.
  const displayRank = period === 'all' ? (periodRank ?? derivedRank) : (periodRank ?? null);

  useEffect(() => {
    // initial load
    void loadAll();
  }, []);

  const loadAll = async () => {
    try {
      await userStore.fetchUserProfile();
      // fetch all three datasets in parallel
      setLoadingMap({ all: true, week: true, month: true });
      const [allResp, weekResp, monthResp] = await Promise.all([
        apiService.getTopPlayersPeriod('all'),
        apiService.getTopPlayersPeriod('week'),
        apiService.getTopPlayersPeriod('month'),
      ]);
      setLists({
        all: (allResp.data?.data || []) as any[],
        week: (weekResp.data?.data || []) as any[],
        month: (monthResp.data?.data || []) as any[],
      });
    } catch (error: any) {
      uiStore.showToast('Failed to load leaderboard', 'error');
    } finally {
      setLoadingMap({ all: false, week: false, month: false });
    }
  };
  const loadLeaderboard = loadAll;

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const LeaderboardItem: React.FC<{ item: any; isCurrentUser: boolean; medal: string | null }> = React.memo(({ item, isCurrentUser, medal }) => {
    const scale = React.useRef(new Animated.Value(1)).current;
    useEffect(() => {
      // subtle pulse on mount
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.02, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, [scale]);

    const getAccent = (rank: number, isMe: boolean) => {
      if (isMe) return COLORS.secondary;
      switch (rank) {
        case 1:
          return '#FFD700'; // gold
        case 2:
          return '#C0C0C0'; // silver
        case 3:
          return '#CD7F32'; // bronze
        default:
          return 'transparent';
      }
    };

    const accent = getAccent(item.rank, isCurrentUser);

    return (
    <Animated.View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem, { transform: [{ scale }] }]} accessible={true} accessibilityLabel={`${item.username}, rank ${item.rank}`}>
      <View style={[styles.leftAccent, { backgroundColor: accent }]} />
      <View style={styles.rankContainer}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={styles.rank}>#{item.rank}</Text>
        )}
      </View>

  <View style={styles.playerInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.playerDetails}>
          <View style={styles.badgeRow}>
            <LevelBadge levelName={item.levelName} levelKey={item.levelKey} compact />
          </View>
          <Text style={styles.username}>
            {item.username}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={styles.stats}>
            {item.wins}W / {item.losses}L
          </Text>
        </View>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        {typeof item.periodRatingDelta === 'number' ? (
          <Text style={styles.ratingDelta}>{item.periodRatingDelta >= 0 ? `+${item.periodRatingDelta}` : String(item.periodRatingDelta)}</Text>
        ) : (
          <Text style={styles.rating}>{item.rating}</Text>
        )}
        {typeof item.periodRatingDelta === 'number' && <Text style={styles.smallText}>this period</Text>}
      </View>
      </Animated.View>
    );
  });

  const renderItem = React.useCallback(({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.username === userStore.user?.username;
    const medal = getMedalEmoji(item.rank);
    return <LeaderboardItem item={item} isCurrentUser={isCurrentUser} medal={medal} />;
  }, [userStore.user?.username]);

  const isLoading = loadingMap[period] || (userStore.isLoading && lists.all.length === 0);
  if (isLoading) {
    return <LoadingSpinner message="Loading leaderboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Top 100 Coders</Text>
      </View>

      {/* Tabs - moved above My Rank */}
      <View style={styles.tabRowContainer}>
        <View style={styles.tabRowInner}>
          {(['all','week','month'] as const).map((p) => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[styles.tabButton, period === p && styles.tabActive]}>
              <Text style={[styles.tabText, period === p && styles.tabTextActive]}>{p === 'all' ? 'All Time' : p === 'week' ? 'Weekly' : 'Monthly'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* My Rank Card - improved UI */}
      {user && (
        <View style={[styles.myRankCard, styles.myRankCardImproved]} accessible accessibilityLabel={`Your rank ${displayRank ?? 'not ranked'}, rating ${userStore.userRating}`}>
          <View style={[styles.leftAccentBig, { backgroundColor: COLORS.secondary }]} />
          <View style={styles.myRankBody}>
            <View style={styles.myRankTopRow}>
              <View style={styles.myRankInfo}>
                <Text style={styles.myRankTitle}>Your Rank</Text>
                <Text style={styles.myRankValue}>{displayRank ? `#${displayRank}` : '--'}</Text>
                {!displayRank && (
                  <Text style={styles.unrankedHint}>You're not on this list</Text>
                )}
              </View>

              <View style={styles.myRankRightCompact}>
                <Text style={styles.myRatingValue}>{userStore.userRating}</Text>
              </View>
            </View>

            {/* compact stats row */}
            <View style={styles.myRankStatsRow}>
              <Text style={styles.myWL}>{(user?.wins ?? 0)}W / {(user?.losses ?? 0)}L</Text>
              <Text style={styles.mySmallRating}>{/* placeholder for symmetry */}</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={period === 'all' ? lists.all : period === 'week' ? lists.week : lists.month}
        renderItem={renderItem}
        keyExtractor={(item, idx) => (item.rank ? String(item.rank) : String(idx))}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loadingMap[period]}
            onRefresh={loadLeaderboard}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rankings available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: (0-50),
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 20,
  },
  myRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  myRankCardImproved: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 0,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  myRankBody: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    padding: 8,
  },
  myRankTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  myRankInfo: { flex: 1 },
  myRankRightCompact: { alignItems: 'flex-end', marginLeft: 8 },
  progressLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 },
  progressBarBackground: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: COLORS.secondary },
  myRankBottomRow: { marginTop: 10 },
  myRankStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  mySmallRating: { color: COLORS.textSecondary, fontSize: 12 },
  myRankLeft: { alignItems: 'flex-start', flex: 1 },
  myBadgeColumn: { flex: 1, alignItems: 'center' },
  myRankRight: { alignItems: 'flex-end', flex: 1 },
  myRankTitle: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  myRankValue: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  myRankValueCompact: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  unrankedHint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  myRatingLabel: { color: COLORS.textSecondary, fontSize: 12 },
  myRatingValue: { color: COLORS.secondary, fontSize: 20, fontWeight: '700' },
  myWL: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  leftAccentBig: {
    width: 8,
    height: '100%',
    marginRight: 0,
  },
  levelWrap: { marginBottom: 6 },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    // square look: no rounding, side margins
    borderRadius: 0,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentUserItem: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}12`,
  },
  leftAccent: {
    width: 6,
    height: '100%',
    marginRight: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  medal: {
    fontSize: 28,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  playerDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  stats: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  badgeRow: {
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  rating: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    elevation: 2,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  tabTextActive: {
    color: COLORS.white,
  },
  tabRowContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabRowInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    padding: 6,
    borderRadius: 12,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  ratingDelta: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  smallText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});
