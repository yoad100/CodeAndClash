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
import SubjectCard from '../../components/analytics/SubjectCard';
import Svg, { Circle } from 'react-native-svg';
import { apiService } from '../../services/api.service';

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

  // Analytics state
  const [analytics, setAnalytics] = React.useState<Array<{ subject: string; correct: number; incorrect: number; total: number }>>([]);
  const [loadingAnalytics, setLoadingAnalytics] = React.useState(false);

  // Fetch analytics when screen mounts (only for premium users)
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!userStore.isPremium) return;
      setLoadingAnalytics(true);
        try {
        const resp = await apiService.getMySubjectAnalytics();
        if (!mounted) return;
        // Support backend returning { data: [...] } or direct array
        const payload = resp.data?.data ?? resp.data ?? [];
        setAnalytics(payload);
      } catch (err) {
        console.warn('Failed to load analytics', err);
      } finally {
        if (mounted) setLoadingAnalytics(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [userStore.isPremium]);

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

        {/* (analytics moved below) */}

        <View style={styles.privateMatchSection}>
          <Text style={styles.sectionTitle}>Private Match</Text>
          <Text style={styles.sectionSubtitle}>
            {userStore.isPremium ? 'Challenge a friend in an unranked battle' : 'Available with Premium'}
          </Text>
          <ArcadeButton
            title={userStore.isPremium ? 'Create Invite' : 'Upgrade to Unlock'}
            onPress={handleInviteFriend}
            variant={userStore.isPremium ? 'primary' : 'premium'}
            size="lg"
            style={styles.inviteButton as any}
            iconLeft={userStore.isPremium ? <Ionicons name="people" size={20} color={COLORS.white} /> : undefined}
            textStyle={userStore.isPremium ? (styles.inviteButtonText as any) : (styles.upgradeButtonGoldText as any)}
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

        {/* Analytics dashboard: boxed card below the subjects grid */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Your Subject Stats</Text>
          {userStore.isPremium ? (
            loadingAnalytics ? (
              <Text style={styles.sectionSubtitle}>Loading…</Text>
            ) : analytics.length === 0 ? (
              <Text style={styles.sectionSubtitle}>No data yet — play some matches to gather stats.</Text>
            ) : (
              <>
                {/* chart removed - per request use small circle charts in each SubjectCard */}
                <View>
                  {(() => {
                    const knownMap = new Map(SUBJECTS.map(s => [String(s.id).toLowerCase(), s.name]));
                    // Group by the raw subject string, but display a friendly name when available
                    const grouped: Record<string, { correct: number; incorrect: number; raws: Set<string> }> = {};
                    for (const row of analytics) {
                      const raw = String(row.subject ?? 'unknown');
                      const keyLower = raw.toLowerCase();
                      // Use raw as grouping key so we preserve every distinct subject seen
                      const groupKey = raw;
                      if (!grouped[groupKey]) grouped[groupKey] = { correct: 0, incorrect: 0, raws: new Set() };
                      grouped[groupKey].correct += row.correct;
                      grouped[groupKey].incorrect += row.incorrect;
                      grouped[groupKey].raws.add(raw);
                    }

                    const prettify = (s: string) => {
                      if (!s) return s;
                      const low = String(s).toLowerCase();
                      // If it's a known subject id, return its friendly name
                      const mapped = knownMap.get(low);
                      if (mapped) return mapped;
                      // Otherwise, convert common separators and capitalize words
                      return String(s)
                        .replace(/[_-]/g, ' ')
                        .split(/\s+/)
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');
                    };

                    return Object.entries(grouped).map(([rawKey, vals]) => {
                      const displayName = prettify(rawKey);
                      // No generic "Any Subject" — show the raw key prettified (e.g., 'any' => 'Any')
                      return (
                        <SubjectCard
                          key={rawKey}
                          subjectName={displayName}
                          subtitle={undefined}
                          correct={vals.correct}
                          incorrect={vals.incorrect}
                        />
                      );
                    });
                  })()}
                </View>
              </>
            )
          ) : (
            // Teaser for non-premium users: small, tasteful preview + upgrade CTA
            <>
              <Text style={styles.sectionSubtitle}>
                Unlock detailed subject analytics — see accuracy per topic, strengths and areas to improve.
              </Text>
              <View style={styles.teaserPreview}>
                {SUBJECTS.slice(0, 3).map((s, idx) => {
                  const demoPcts = [37, 15, 92];
                  const pct = demoPcts[idx] ?? 0;
                  const SIZE = 64;
                  const STROKE = 6;
                  const R = (SIZE - STROKE) / 2;
                  const C = 2 * Math.PI * R;
                  const dash = C * (1 - pct / 100);
                  return (
                    <View key={s.id} style={styles.teaserMiniWrap}>
                      <Text style={styles.teaserIcon}>{s.icon}</Text>
                      <Text style={styles.teaserName}>{s.name}</Text>
                      <View style={styles.teaserMiniStat}>
                        <Svg width={SIZE} height={SIZE}>
                          <Circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={R}
                            stroke={COLORS.border}
                            strokeWidth={STROKE}
                            fill="transparent"
                          />
                          <Circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={R}
                            stroke={COLORS.primary}
                            strokeWidth={STROKE}
                            strokeLinecap="round"
                            fill="transparent"
                            strokeDasharray={`${C} ${C}`}
                            strokeDashoffset={dash}
                            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                          />
                        </Svg>
                        <View style={styles.teaserPctLabel}><Text style={styles.teaserPctText}>{pct}%</Text></View>
                      </View>
                    </View>
                  );
                })}
              </View>
              <View style={{ marginTop: 12 }}>
                <ArcadeButton
                  title="Upgrade to unlock"
                  onPress={() => navigation.navigate('PremiumUpgrade')}
                  variant="premium"
                  size="md"
                  style={styles.upgradeButton}
                  textStyle={styles.upgradeButtonGoldText as any}
                />
              </View>
              <Text style={styles.teaserNote}>Preview only — real stats appear after upgrading and playing matches.</Text>
            </>
          )}
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
    //weird margin offset in mobile view
    marginTop: (0-50),
  },
  scrollContent: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    marginBottom: 12,
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
    marginBottom: 45,
    justifyContent: 'center',
  },
  subjectCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    position: 'relative',
    marginHorizontal: '0.5%',
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
  upgradeButtonGold: {
    width: '100%',
    backgroundColor: '#D4AF37',
    borderWidth: 0,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#FFD54F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  upgradeButtonGoldText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2B1B00',
    textShadowColor: 'rgba(255, 223, 99, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 0.6,
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
  // Analytics card styles
  analyticsCard: {
    marginTop: 0,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    // make it roughly square on small screens while responsive
    minHeight: 140,
    alignSelf: 'stretch',
  },
  teaserPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'stretch',
  },
  teaserMiniWrap: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  teaserMiniStat: {
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teaserPctLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teaserPctText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  teaserCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  teaserIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  teaserName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  teaserStatsPlaceholder: {
    width: '100%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teaserPct: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  teaserNote: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sectionCard: {
    marginTop: 28,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // chartBox removed
});
