import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Modal,
  Pressable,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { rootStore } from '../../stores/RootStore';
import { SUBJECTS } from '../../constants/subjects';
import { Button } from '../common/Button';
import { COLORS } from '../../constants/colors';

const findSubjectName = (subjectId?: string | null): string => {
  if (!subjectId || subjectId === 'any') return 'any subject';
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  return subject ? subject.name : subjectId;
};

export const IncomingInviteDialog: React.FC = observer(() => {
  const { matchStore } = rootStore;
  const invite = matchStore.incomingInvite;

  const handleAccept = React.useCallback(() => {
    matchStore.respondToInvite(true);
  }, [matchStore]);

  const handleDecline = React.useCallback(() => {
    matchStore.respondToInvite(false);
  }, [matchStore]);

  if (!invite) {
    return null;
  }

  const subjectName = findSubjectName(invite.subject);
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleDecline}
    >
      <Pressable style={styles.overlay} onPress={handleDecline}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.label}>Incoming invite</Text>
          <Text style={styles.username}>{invite.fromUsername}</Text>
          <View style={styles.subjectPill}>
            <Text style={styles.subjectText}>{subjectName}</Text>
          </View>
          <Text style={styles.message}>
            Ready for a quick duel?
          </Text>
          <View style={styles.buttonsRow}>
            <Button
              title="Decline"
              onPress={handleDecline}
              variant="outline"
              size="small"
              style={styles.button}
              textStyle={styles.buttonText}
            />
            <Button
              title="Accept"
              onPress={handleAccept}
              variant="secondary"
              size="small"
              style={StyleSheet.flatten([styles.button, styles.acceptButton])}
              textStyle={styles.buttonText}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 11, 27, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 22,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  subjectPill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    textTransform: 'capitalize',
  },
  message: {
    marginTop: 18,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 10,
  },
  button: {
    flexBasis: 120,
    minWidth: 0,
    paddingHorizontal: 18,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 15,
  },
});
