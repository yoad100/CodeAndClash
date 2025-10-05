import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../constants/colors';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, actionLabel, onAction }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    return () => {
      // animate out quickly when unmounting
      Animated.timing(opacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    };
  }, [opacity]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      default:
        return COLORS.primary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor(), opacity },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} style={styles.actionButton} accessibilityRole="button">
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button">
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  closeText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, marginRight: 8 },
  actionText: { color: COLORS.white, fontWeight: '700' },
});
