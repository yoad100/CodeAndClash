import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ArcadeButton } from '../../components/fx/ArcadeButton';
import { COLORS } from '../../constants/colors';
import { SUBJECTS } from '../../constants/subjects';
import { rootStore } from '../../stores/RootStore';
import { RootStackParamList } from '../../navigation/types';

type PremiumNavigationProp = StackNavigationProp<RootStackParamList>;

export const PremiumScreen: React.FC = observer(() => {
  const navigation = useNavigation<PremiumNavigationProp>();
  const { userStore, matchStore } = rootStore;

  const handleSubjectSelect = (subjectId: string) => {
    if (!userStore.isPremium) {
      navigation.navigate('PremiumUpgrade');
      return;
    }
    matchStore.startSearch(subjectId);
    navigation.navigate('MatchLobby');
  };

  const handleInviteFriend = () => {
    if (!userStore.isPremium) {
      navigation.navigate('PremiumUpgrade');
      return;
    }
    // This would open a private match creation flow for premium users
    rootStore.uiStore.showToast('Private match coming soon!', 'info');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>👑 Premium Battle</Text>
          <Text style={styles.subtitle}>
            {userStore.isPremium ? 'Choose your battlefield' : 'Explore Premium subjects — tap to upgrade'}
          </Text>
        </View>

        <View style={styles.privateMatchSection}>
          <Text style={styles.sectionTitle}>Private Match</Text>
          <Text style={styles.sectionSubtitle}>
            {userStore.isPremium ? 'Challenge a friend in an unranked battle' : 'Available with Premium'}
          </Text>
          <ArcadeButton
            title={userStore.isPremium ? 'Invite Friend 👥' : 'Upgrade to Unlock'}
            onPress={handleInviteFriend}
            variant="ghost"
            size="lg"
            style={styles.inviteButton}
          />
        </View>

        <View style={styles.orDivider}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.subjectsGrid}>
          {SUBJECTS.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={styles.subjectCard}
              onPress={() => handleSubjectSelect(subject.id)}
              activeOpacity={0.7}
            >
              {!userStore.isPremium && (
                <Text style={styles.crownIcon} accessibilityLabel="Premium feature">👑</Text>
              )}
              <Text style={styles.subjectIcon}>{subject.icon}</Text>
              <Text style={styles.subjectName}>{subject.name}</Text>
              {!userStore.isPremium && (
                <Text style={styles.lockBadge}>Unlock with Premium</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  upgradeButton: {
    minWidth: 250,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  subjectCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  subjectIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  lockBadge: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  crownIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
    opacity: 0.9,
  },
  privateMatchSection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  inviteButton: {
    width: '100%',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
