import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getLevelDisplay, PLAYER_LEVELS_DESC } from '../../constants/levels';

interface LevelBadgeProps {
  levelName?: string;
  levelKey?: string;
  compact?: boolean;
  testID?: string;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ levelName, levelKey, compact = false, testID }) => {
  const shimmer = React.useRef(new Animated.Value(0)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;
  const orbit = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmerAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );

    const orbitAnim = Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 5200, easing: Easing.linear, useNativeDriver: true })
    );

    shimmerAnim.start();
    pulseAnim.start();
    orbitAnim.start();
    return () => {
      shimmerAnim.stop();
      pulseAnim.stop();
      orbitAnim.stop();
    };
  }, [orbit, pulse, shimmer]);

  const level = getLevelDisplay(levelName, levelKey);
  const strength = React.useMemo(() => (PLAYER_LEVELS_DESC.length - level.tier) / PLAYER_LEVELS_DESC.length, [level.tier]);
  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2 + strength * 0.12] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.05] });
  const rotate = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const particleRadius = compact ? 16 : 22;

  const particles = React.useMemo(() => {
    if (!Array.isArray(level.particleColors) || level.particleColors.length === 0) {
      return [];
    }
    return level.particleColors.map((color, index) => {
      const angle = (2 * Math.PI * index) / level.particleColors.length;
      return {
        color,
        translateX: Math.cos(angle) * particleRadius,
        translateY: Math.sin(angle) * particleRadius,
      };
    });
  }, [level.particleColors, particleRadius]);

  return (
    <View style={compact ? styles.compactContainer : styles.container} testID={testID}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulseRing,
          {
            borderColor: level.accent,
            opacity: Animated.multiply(pulseOpacity, strength + 0.5),
            transform: [{ scale: pulseScale }],
          },
        ]}
      />
      <Animated.View pointerEvents="none" style={[styles.orbit, { transform: [{ rotate }] }]}
      >
        {particles.map((particle, index) => (
          <View
            key={`${level.key}-particle-${index}`}
            style={[
              styles.particle,
              {
                backgroundColor: particle.color,
                transform: [{ translateX: particle.translateX }, { translateY: particle.translateY }],
                opacity: 0.35 + strength * 0.45,
              },
            ]}
          />
        ))}
      </Animated.View>
      <LinearGradient
        colors={level.gradient}
        style={compact ? styles.compactGradient : styles.gradient}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            {
              backgroundColor: level.shimmer,
              opacity: shimmerOpacity,
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.beam, { backgroundColor: level.beam, opacity: 0.15 + strength * 0.35, transform: [{ scaleX: compact ? 1.05 : 1.25 }] }]}
        />
        <View style={styles.content}>
          {level.icon ? (
            <Ionicons
              name={level.icon as any}
              size={compact ? 12 : 14}
              color={level.text}
              style={styles.icon}
            />
          ) : null}
          <Text style={[styles.text, { color: level.text }]} numberOfLines={1}>
            {level.name}
          </Text>
        </View>
      </LinearGradient>
      <View style={[styles.glow, { shadowColor: level.glow, shadowOpacity: 0.25 + strength * 0.25 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'visible',
    minWidth: 92,
  },
  compactContainer: {
    borderRadius: 12,
    overflow: 'visible',
    minWidth: 64,
    maxWidth: 140,
  },
  gradient: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 86,
  },
  compactGradient: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.45,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  beam: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    opacity: 0.3,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  icon: {
    marginRight: 6,
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 2,
  },
  orbit: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
