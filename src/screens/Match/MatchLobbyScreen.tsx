import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../../components/common/Button';
import { ArcadeButton } from '../../components/fx/ArcadeButton';
import Hourglass from '../../components/fx/Hourglass';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';
import { RootStackParamList } from '../../navigation/types';

type NavProp = StackNavigationProp<RootStackParamList>;

export const MatchLobbyScreen: React.FC = observer(() => {
  const { matchStore, uiStore } = rootStore;
  const navigation = useNavigation<NavProp>();

  useEffect(() => {
    // navigate to Match screen when a match is created (pending or active)
    if (matchStore.currentMatch) {
      navigation.navigate('Match');
    }
  }, [matchStore.currentMatch?.status]);

  const handleCancel = () => {
    matchStore.cancelSearch();
    navigation.goBack();
  };

  const opponent = matchStore.opponentPlayer;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {!matchStore.currentMatch || matchStore.currentMatch.status === 'pending' ? (
          <>
            <Hourglass label="Finding Opponent" durationMs={20000} loop={true} showCountdown={true} />
            <Text style={styles.hint}>Searching the arena for a worthy rival…</Text>
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
});

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
});
