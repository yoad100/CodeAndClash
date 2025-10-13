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
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    spinAnim.start();
    pulseAnim.start();
    return () => {
      spinAnim.stop();
      pulseAnim.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.12] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
      <AnimatedSmartImage
        primary={() => require('../../../assets/Code&ClashLogo.png')}
        style={[styles.logo, { transform: [{ rotate }] }]}
        resizeMode="contain"
      />
      {message && <Text style={styles.message}>{message}</Text>}
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
});
