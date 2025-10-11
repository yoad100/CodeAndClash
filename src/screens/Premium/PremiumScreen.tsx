import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
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
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';

type PremiumNavigationProp = StackNavigationProp<RootStackParamList>;

export const PremiumScreen: React.FC = observer(() => {
  const navigation = useNavigation<PremiumNavigationProp>();
  const { userStore, matchStore } = rootStore;
  const [inviteModalVisible, setInviteModalVisible] = React.useState(false);
  const [inviteUsername, setInviteUsername] = React.useState('');
  const [inviteSubject, setInviteSubject] = React.useState<string>('any');
  const [inviteError, setInviteError] = React.useState<string | null>(null);

  const outgoingInvite = matchStore.outgoingInvite;
  const subjectOptions = React.useMemo(() => [{ id: 'any', name: 'Any Subject', icon: '🎲' }, ...SUBJECTS], []);

  const inviteStatusCopy = React.useMemo(() => {
    if (!outgoingInvite) return null;
    const subjectName = outgoingInvite.subject
      ? subjectOptions.find((opt) => opt.id === outgoingInvite.subject)?.name || outgoingInvite.subject
      : undefined;
    const subjectLabel = subjectName ? ` • ${subjectName}` : '';
    switch (outgoingInvite.status) {
      case 'pending':
        return `Waiting for ${outgoingInvite.targetUsername} to accept${subjectLabel}…`;
      case 'accepted':
        return `${outgoingInvite.targetUsername} accepted! Launching match${subjectLabel}.`;
      case 'declined':
        return `${outgoingInvite.targetUsername} declined the invite${subjectLabel ? subjectLabel : ''}.`;
      case 'expired':
        return `Invite to ${outgoingInvite.targetUsername} expired.`;
      case 'error':
        return outgoingInvite.message || 'Invite failed. Try again.';
      default:
        return outgoingInvite.message || null;
    }
  }, [outgoingInvite, subjectOptions]);

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
    setInviteError(null);
    setInviteUsername('');
    setInviteSubject('any');
    setInviteModalVisible(true);
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
            title={userStore.isPremium ? 'Create Invite' : 'Upgrade to Unlock'}
            onPress={handleInviteFriend}
            variant={userStore.isPremium ? 'primary' : 'ghost'}
            size="lg"
            style={styles.inviteButton}
            iconLeft={userStore.isPremium ? <Ionicons name="people" size={20} color={COLORS.white} /> : undefined}
            textStyle={userStore.isPremium ? styles.inviteButtonText : undefined}
          />
          {inviteStatusCopy && (
            <View style={styles.inviteStatusBox}>
              <Text style={styles.inviteStatusText}>{inviteStatusCopy}</Text>
            </View>
          )}
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

      <Modal
        visible={inviteModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!matchStore.isSendingInvite) setInviteModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={styles.modalTitle}>Invite a challenger</Text>
              <Text style={styles.modalDescription}>
                Enter your friend&rsquo;s username to send a private duel invite.
              </Text>
              <TextInput
                value={inviteUsername}
                onChangeText={(text) => {
                  setInviteUsername(text);
                  if (inviteError) setInviteError(null);
                }}
                placeholder="Friend's username"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.modalInput}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!matchStore.isSendingInvite}
              />
              {inviteError ? <Text style={styles.modalError}>{inviteError}</Text> : null}
              <Text style={styles.modalSubtitle}>Pick a subject</Text>
              <View style={styles.modalSubjects}>
                {subjectOptions.map((option) => {
                  const active = inviteSubject === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.subjectChip, active && styles.subjectChipActive]}
                      onPress={() => setInviteSubject(option.id)}
                      activeOpacity={0.8}
                      disabled={matchStore.isSendingInvite}
                    >
                      <Text style={[styles.subjectChipText, active && styles.subjectChipTextActive]}>
                        {option.icon} {option.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  if (!matchStore.isSendingInvite) setInviteModalVisible(false);
                }}
                variant="outline"
                size="small"
                style={styles.modalButtonCancel}
                textStyle={styles.modalButtonText}
              />
              <Button
                title={matchStore.isSendingInvite ? 'Sending…' : 'Send Invite'}
                onPress={async () => {
                  if (matchStore.isSendingInvite) return;
                  const trimmed = inviteUsername.trim();
                  if (trimmed.length < 3) {
                    setInviteError('Enter a valid username');
                    return;
                  }
                  try {
                    await matchStore.sendPrivateInvite(trimmed, inviteSubject === 'any' ? undefined : inviteSubject);
                    setInviteModalVisible(false);
                  } catch (err: any) {
                    setInviteError(err instanceof Error ? err.message : 'Failed to send invite');
                  }
                }}
                size="small"
                style={styles.modalButtonConfirm}
                textStyle={styles.modalButtonConfirmText}
                icon={<Ionicons name="people" size={16} color={COLORS.white} />}
                variant="primary"
                disabled={matchStore.isSendingInvite}
                loading={matchStore.isSendingInvite}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  inviteStatusBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(94, 234, 255, 0.08)',
  },
  inviteStatusText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
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
  inviteButtonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    maxHeight: '90%',
  },
  modalContent: {
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  modalInput: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    fontSize: 16,
  },
  modalError: {
    marginTop: 8,
    color: COLORS.error,
    fontSize: 13,
  },
  modalSubtitle: {
    marginTop: 20,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textSecondary,
  },
  modalSubjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  subjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  subjectChipActive: {
    borderColor: COLORS.secondary,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  subjectChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  subjectChipTextActive: {
    color: COLORS.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButtonCancel: {
    minWidth: 120,
    paddingHorizontal: 18,
  },
  modalButtonConfirm: {
    minWidth: 120,
    paddingHorizontal: 18,
  },
  modalButtonText: {
    fontSize: 15,
  },
  modalButtonConfirmText: {
    fontSize: 15,
    color: COLORS.white,
  },
});
