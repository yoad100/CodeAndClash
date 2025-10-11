import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Button } from './Button';
import { COLORS } from '../../constants/colors';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.messageContainer}>
            <ScrollView
              style={styles.messageScroll}
              contentContainerStyle={styles.messageContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.message}>{message}</Text>
            </ScrollView>
          </View>
          <View style={styles.buttons}>
            <Button
              title={cancelText}
              onPress={onCancel}
              variant="outline"
              size="small"
              style={styles.button}
            />
            <Button
              title={confirmText}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'primary'}
              size="small"
              style={styles.button}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 420,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  messageContainer: {
    maxHeight: '60%',
    marginBottom: 24,
    width: '100%',
    flexShrink: 1,
  },
  messageScroll: {
    maxHeight: '100%',
  },
  messageContent: {
    paddingRight: 6,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'left',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    width: '100%',
  },
  button: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 120,
  },
});
