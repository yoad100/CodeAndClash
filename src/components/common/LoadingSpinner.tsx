import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Image, Easing } from 'react-native';
import { AnimatedSmartImage } from './SmartImage';
import { COLORS } from '../../constants/colors';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
}) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );

    const dots = Animated.loop(
      Animated.timing(dotAnim, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );

    pulseAnim.start();
    dots.start();
    return () => {
      pulseAnim.stop();
      dots.stop();
    };
  }, [pulse, dotAnim]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.08] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.72] });
  const dotOffset = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });

  const small = size === 'small';
  const ringSize = small ? 80 : 160;

  return (
    <View style={[styles.container, small && styles.containerSmall]}>
      <Animated.View style={[styles.ring, { width: ringSize, height: ringSize, borderRadius: ringSize / 2, transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
      <Animated.View style={[styles.logoPlaceholder, { width: ringSize * 0.8, height: ringSize * 0.35 }]} />

      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              small && styles.dotSmall,
              { opacity: 0.9, transform: [{ translateY: Animated.add(dotOffset, new Animated.Value(i * -4)) }] },
            ]}
          />
        ))}
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2.5,
    borderColor: COLORS.glowCyan,
    shadowColor: COLORS.glowCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  logo: {
    width: 200,
    height: 72,
  },
  message: {
    marginTop: 18,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  containerSmall: {
    padding: 12,
  },
  logoPlaceholder: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
    marginHorizontal: 4,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
