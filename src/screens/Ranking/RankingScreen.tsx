import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';
import { LeaderboardEntry } from '../../types/user.types';

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

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      await userStore.fetchUserProfile();
      await userStore.fetchLeaderboard();
    } catch (error: any) {
      uiStore.showToast('Failed to load leaderboard', 'error');
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

  const LeaderboardItem: React.FC<{ item: LeaderboardEntry; isCurrentUser: boolean; medal: string | null }> = React.memo(({ item, isCurrentUser, medal }) => (
  <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]} accessible={true} accessibilityLabel={`${item.username}, rank ${item.rank}`}>
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
          <Text style={styles.username}>
            {item.username}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={styles.stats}>
            {item.wins}W / {item.losses}L
          </Text>
        </View>
      </View>

      <Text style={styles.rating}>{item.rating}</Text>
    </View>
  ));

  const renderItem = React.useCallback(({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.username === userStore.user?.username;
    const medal = getMedalEmoji(item.rank);
    return <LeaderboardItem item={item} isCurrentUser={isCurrentUser} medal={medal} />;
  }, [userStore.user?.username]);

  if (userStore.isLoading && userStore.leaderboard.length === 0) {
    return <LoadingSpinner message="Loading leaderboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Top 100 Coders</Text>
      </View>

      {/* My Rank Card */}
      {user && (
        <View style={styles.myRankCard} accessible accessibilityLabel={`Your rank ${derivedRank ?? 'not ranked'}, rating ${userStore.userRating}`}>
          <View style={styles.myRankLeft}>
            <Text style={styles.myRankTitle}>Your Rank</Text>
            <Text style={styles.myRankValue}>{derivedRank ? `#${derivedRank}` : '—'}</Text>
            {!derivedRank && (
              <Text style={styles.unrankedHint}>Play matches to place on the board</Text>
            )}
          </View>
          <View style={styles.myRankRight}>
            <Text style={styles.myRatingLabel}>Rating</Text>
            <Text style={styles.myRatingValue}>{userStore.userRating}</Text>
            <Text style={styles.myWL}>{(user?.wins ?? 0)}W / {(user?.losses ?? 0)}L</Text>
          </View>
        </View>
      )}

      <FlatList
        data={userStore.leaderboard}
        renderItem={renderItem}
        keyExtractor={(item) => item.rank.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={userStore.isLoading}
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
  },
  header: {
    padding: 20,
    paddingBottom: 16,
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
    padding: 20,
    paddingTop: 0,
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
  myRankLeft: { alignItems: 'flex-start' },
  myRankRight: { alignItems: 'flex-end' },
  myRankTitle: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  myRankValue: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  unrankedHint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  myRatingLabel: { color: COLORS.textSecondary, fontSize: 12 },
  myRatingValue: { color: COLORS.secondary, fontSize: 20, fontWeight: '700' },
  myWL: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  currentUserItem: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}12`,
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
});
