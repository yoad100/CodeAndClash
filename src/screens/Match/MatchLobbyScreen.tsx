import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Note: avoid wrapping this screen with MobX observer to prevent Fabric + Animated conflicts
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../../components/common/Button';
import { ArcadeButton } from '../../components/fx/ArcadeButton';
import { HourglassBeautiful } from '../../components/fx/HourglassBeautiful';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';
import { RootStackParamList } from '../../navigation/types';
import { reaction } from 'mobx';
import { SUBJECTS } from '../../constants/subjects';

type NavProp = StackNavigationProp<RootStackParamList>;

export const MatchLobbyScreen: React.FC = () => {
  const { matchStore, uiStore } = rootStore;
  const navigation = useNavigation<NavProp>();

  useEffect(() => {
    // React to match status changes without making the whole screen an observer
    const dispose = reaction(
      () => matchStore.currentMatch?.status,
      (status) => {
        if (status) {
          navigation.navigate('Match');
        }
      },
      { fireImmediately: false }
    );
    return () => dispose();
  }, [navigation, matchStore]);

  const handleCancel = () => {
    matchStore.cancelSearch();
    navigation.goBack();
  };

  const opponent = matchStore.opponentPlayer;
  const selectedSubject = matchStore.searchSubject;
  const subjectName = React.useMemo(() => {
    if (!selectedSubject || selectedSubject === 'any') return 'Any subject';
    const subject = SUBJECTS.find((s) => s.id === selectedSubject);
    return subject ? subject.name : selectedSubject;
  }, [selectedSubject]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {!matchStore.currentMatch || matchStore.currentMatch.status === 'pending' ? (
          <>
            <HourglassBeautiful />
            <Text style={styles.hint}>Finding Opponent…</Text>
            <Text style={styles.subjectHint}>Focus: {subjectName}</Text>
                      <View style={styles.buttonContainer}>
            <ArcadeButton
              title="Cancel Search"
              onPress={handleCancel}
              variant="danger"
              size="lg"
              style={styles.cancelButton}
            />
          </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Match found!</Text>
            {opponent && (
              <View style={styles.opponentCard}>
                <Text style={styles.opponentName}>{opponent.username}</Text>
                <Text style={styles.opponentInfo}>Score: {opponent.score ?? 0}</Text>
              </View>
            )}
            <Text style={styles.ready}>Prepare for battle… entering arena!</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 },
  title: { fontSize: 22, color: COLORS.text, fontWeight: 'bold', marginBottom: 8 },
  hint: { fontSize: 14, color: COLORS.textSecondary, marginVertical: 16, textAlign: 'center' },
  opponentCard: { padding: 20, backgroundColor: COLORS.cardBackground, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, marginVertical: 16, alignItems: 'center' },
  opponentName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  opponentInfo: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },
  ready: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  cancelButton: {
    marginTop: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  subjectHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
