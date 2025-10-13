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
  const flame1 = React.useRef(new Animated.Value(0)).current;
  const flame2 = React.useRef(new Animated.Value(0)).current;
  const flame3 = React.useRef(new Animated.Value(0)).current;
  const lightning = React.useRef(new Animated.Value(0)).current;
  const spark = React.useRef(new Animated.Value(0)).current;

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

    // Flame animations for Master level
    const flame1Anim = Animated.loop(
      Animated.sequence([
        Animated.timing(flame1, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flame1, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const flame2Anim = Animated.loop(
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(flame2, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flame2, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const flame3Anim = Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(flame3, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flame3, { toValue: 0, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    // Lightning animation for Guru level
    const lightningAnim = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(lightning, { toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(lightning, { toValue: 0, duration: 100, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(lightning, { toValue: 1, duration: 80, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(lightning, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
      ])
    );

    // Spark animation for high-tier levels
    const sparkAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(spark, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(spark, { toValue: 0, duration: 100, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(800),
      ])
    );

    shimmerAnim.start();
    pulseAnim.start();
    orbitAnim.start();
    flame1Anim.start();
    flame2Anim.start();
    flame3Anim.start();
    lightningAnim.start();
    sparkAnim.start();

    return () => {
      shimmerAnim.stop();
      pulseAnim.stop();
      orbitAnim.stop();
      flame1Anim.stop();
      flame2Anim.stop();
      flame3Anim.stop();
      lightningAnim.stop();
      sparkAnim.stop();
    };
  }, [orbit, pulse, shimmer, flame1, flame2, flame3, lightning, spark]);

  const level = getLevelDisplay(levelName, levelKey);
  const strength = React.useMemo(() => (PLAYER_LEVELS_DESC.length - level.tier) / PLAYER_LEVELS_DESC.length, [level.tier]);
  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2 + strength * 0.12] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.05] });
  const rotate = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const particleRadius = compact ? 16 : 22;

  // Flame animations for Master
  const flame1Y = flame1.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const flame1Opacity = flame1.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.8, 1, 0] });
  const flame1Scale = flame1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });

  const flame2Y = flame2.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const flame2Opacity = flame2.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.7, 0.9, 0] });
  const flame2Scale = flame2.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] });

  const flame3Y = flame3.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const flame3Opacity = flame3.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.6, 0.8, 0] });
  const flame3Scale = flame3.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] });

  // Lightning animation for Guru
  const lightningOpacity = lightning.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const lightningScale = lightning.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] });

  // Spark animation for Distinguished and high tiers
  const sparkOpacity = spark.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
  const sparkScale = spark.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.5] });
  const sparkRotate = spark.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  // Negative rotations for spark usages (can't multiply string rotations)
  const sparkRotateNeg = spark.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-180deg'] });
  const sparkRotateNeg15 = spark.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-270deg'] });

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

  // Enhanced effects for top-tier levels
  const isTopTier = level.tier <= 2; // Master, Guru, Distinguished
  const isElite = level.tier <= 5; // Top 6 levels

  return (
    <View style={compact ? styles.compactContainer : styles.container} testID={testID}>
      {/* Extra glow ring for top tiers */}
      {isTopTier && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.extraGlow,
            {
              borderColor: level.accent,
              opacity: Animated.multiply(pulseOpacity, 0.4),
              transform: [{ scale: Animated.multiply(pulseScale, 1.3) }],
            },
          ]}
        />
      )}

      {/* Master Level - Full Ring of Magical Flames (Behind Badge) */}
      {level.key === 'master' && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: 10 }).map((_, i) => {
            // 10 flames, evenly spaced in a circle, closer to badge
            let angle = i * 36; // 360/10
            if (typeof angle !== 'number' || !isFinite(angle)) angle = 0;
            const rad = (angle * Math.PI) / 180;
            const radius = compact ? 20 : 28; // Tighter to badge
            const x = Math.sin(rad) * radius;
            const y = -Math.cos(rad) * radius;
            // Alternate icons and color gradients
            const icon = i % 2 === 0 ? 'flame' : 'flame-outline';
            const color1 = i % 3 === 0 ? '#fde047' : i % 3 === 1 ? '#fb923c' : '#ea580c';
            const color2 = i % 3 === 0 ? '#fb923c' : i % 3 === 1 ? '#ea580c' : '#fde047';
            const size = compact ? 14 : 18;
            // Alternate animation for each flame
            const anim = i % 3 === 0 ? flame1 : i % 3 === 1 ? flame2 : flame3;
            const flicker = 0.8 + 0.2 * (i % 2);
            const xFlick = 0.5 + 0.2 * (i % 2);
            const yFlick = 1 + 0.2 * ((i + 1) % 2);
            const flickerAnim = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + 0.13 * flicker] });
            const xFlicker = anim.interpolate({ inputRange: [0, 1], outputRange: [0, xFlick * 2.5] });
            const yFlicker = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -yFlick * 3.5] });
            const opacityAnim = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.7, 0.95, 0.2] });
            // Always return a valid rotate string, even if Animated.Value returns null/undefined
            const getRotate = (deg: any): Animated.AnimatedInterpolation<string> | string => {
              let val: any = deg;
              if (val == null || (typeof val === 'object' && val._value == null)) {
                if (__DEV__) console.error('LevelBadge: rotate value was null/undefined, forcing to 0deg', val);
                return '0deg';
              }
              if (typeof val === 'object' && typeof val.interpolate === 'function') {
                // Animated interpolation, pass as is
                return val;
              }
              if (typeof val === 'number' && isFinite(val)) return `${val}deg`;
              if (typeof val === 'string' && val.endsWith('deg')) return val;
              return '0deg';
            };
            const rotateTransform = getRotate(angle);
            return (
              <Animated.View
                key={`master-flame-ring-${i}`}
                style={[
                  styles.flame,
                  {
                    left: '50%',
                    top: '50%',
                    marginLeft: x - size / 2,
                    marginTop: y - size / 2,
                    opacity: opacityAnim,
                    shadowColor: color1,
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    zIndex: 0,
                    transform: [
                      { scale: flickerAnim },
                      { translateX: xFlicker },
                      { translateY: yFlicker },
                      { rotate: rotateTransform },
                    ],
                  },
                ]}
              >
                <Ionicons name={icon as any} size={size} color={color1} />
                <Ionicons name={icon as any} size={size - 3} color={color2} style={{ position: 'absolute', left: 1, top: 1, opacity: 0.6 }} />
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Guru Level - Lightning */}
      {level.key === 'guru' && (
        <>
          <Animated.View
            style={[
              styles.lightning,
              {
                top: compact ? -8 : -10,
                left: '20%',
                opacity: lightningOpacity,
                transform: [{ scale: lightningScale }],
              },
            ]}
          >
            <Ionicons name="flash" size={compact ? 14 : 18} color="#c4b5fd" />
          </Animated.View>
          <Animated.View
            style={[
              styles.lightning,
              {
                bottom: compact ? -8 : -10,
                right: '20%',
                opacity: Animated.multiply(lightningOpacity, 0.8),
                transform: [{ scale: lightningScale }, { rotate: '180deg' }],
              },
            ]}
          >
            <Ionicons name="flash" size={compact ? 12 : 16} color="#8b5cf6" />
          </Animated.View>
        </>
      )}

      {/* Distinguished Level - Sparkles */}
      {level.key === 'distinguished' && (
        <>
          <Animated.View
            style={[
              styles.spark,
              {
                top: compact ? -6 : -8,
                right: '15%',
                opacity: sparkOpacity,
                transform: [{ scale: sparkScale }, { rotate: sparkRotate }],
              },
            ]}
          >
            <Ionicons name="sparkles" size={compact ? 12 : 16} color="#93c5fd" />
          </Animated.View>
          <Animated.View
            style={[
              styles.spark,
              {
                bottom: compact ? -6 : -8,
                left: '15%',
                opacity: Animated.multiply(sparkOpacity, 0.7),
                transform: [{ scale: sparkScale }, { rotate: sparkRotate }],
              },
            ]}
          >
            <Ionicons name="star" size={compact ? 10 : 14} color="#60a5fa" />
          </Animated.View>
        </>
      )}

      {/* Staff Level - Leaves */}
      {level.key === 'staff' && (
        <>
          <Animated.View
            style={[
              styles.spark,
              {
                top: compact ? -5 : -7,
                left: '20%',
                opacity: sparkOpacity,
                transform: [{ scale: sparkScale }, { rotate: sparkRotate }],
              },
            ]}
          >
            <Ionicons name="leaf" size={compact ? 12 : 15} color="#6ee7b7" />
          </Animated.View>
          <Animated.View
            style={[
              styles.spark,
              {
                bottom: compact ? -5 : -7,
                right: '20%',
                opacity: Animated.multiply(sparkOpacity, 0.8),
                transform: [{ scale: sparkScale }, { rotate: sparkRotateNeg }],
              },
            ]}
          >
            <Ionicons name="leaf" size={compact ? 11 : 14} color="#34d399" />
          </Animated.View>
        </>
      )}

      {/* Principal Level - Roses */}
      {level.key === 'principal' && (
        <Animated.View
          style={[
            styles.spark,
            {
              top: compact ? -6 : -8,
              right: '50%',
              marginRight: compact ? -6 : -8,
              opacity: sparkOpacity,
              transform: [{ scale: sparkScale }, { rotate: sparkRotate }],
            },
          ]}
        >
          <Ionicons name="rose" size={compact ? 14 : 18} color="#f472b6" />
        </Animated.View>
      )}

      {/* Architect Level - Aperture/Gears */}
      {level.key === 'architect' && (
        <>
          <Animated.View
            style={[
              styles.spark,
              {
                top: compact ? -7 : -9,
                left: '50%',
                marginLeft: compact ? -7 : -9,
                opacity: sparkOpacity,
                transform: [{ scale: sparkScale }, { rotate: sparkRotate }],
              },
            ]}
          >
            <Ionicons name="aperture" size={compact ? 16 : 20} color="#fcd34d" />
          </Animated.View>
          <Animated.View
            style={[
              styles.spark,
              {
                bottom: compact ? -5 : -7,
                right: '30%',
                opacity: Animated.multiply(sparkOpacity, 0.6),
                transform: [{ scale: Animated.multiply(sparkScale, 0.8) }, { rotate: sparkRotateNeg }],
              },
            ]}
          >
            <Ionicons name="cog" size={compact ? 10 : 13} color="#f59e0b" />
          </Animated.View>
        </>
      )}

      {/* Expert Level - Diamonds */}
      {level.key === 'expert' && (
        <>
          <Animated.View
            style={[
              styles.spark,
              {
                top: compact ? -8 : -10,
                left: '25%',
                opacity: sparkOpacity,
                transform: [{ scale: sparkScale }, { rotate: sparkRotate }],
              },
            ]}
          >
            <Ionicons name="diamond" size={compact ? 13 : 16} color="#bfdbfe" />
          </Animated.View>
          <Animated.View
            style={[
              styles.spark,
              {
                top: compact ? -6 : -8,
                right: '25%',
                opacity: Animated.multiply(sparkOpacity, 0.8),
                transform: [{ scale: Animated.multiply(sparkScale, 0.9) }, { rotate: sparkRotateNeg15 }],
              },
            ]}
          >
            <Ionicons name="diamond-outline" size={compact ? 11 : 14} color="#60a5fa" />
          </Animated.View>
        </>
      )}

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
              isElite && styles.particleElite,
              isTopTier && styles.particleTopTier,
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
      <View style={[
        styles.glow, 
        { 
          shadowColor: level.glow, 
          shadowOpacity: 0.25 + strength * 0.35,
          shadowRadius: isTopTier ? 18 : (isElite ? 14 : 12),
        }
      ]} />
      {/* Extra intense glow for Master level */}
      {level.key === 'master' && (
        <View style={[
          styles.glow,
          {
            shadowColor: '#fde047',
            shadowOpacity: 0.4,
            shadowRadius: 24,
          }
        ]} />
      )}
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
  particleElite: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    shadowColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  particleTopTier: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#fff',
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  extraGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 24,
    borderWidth: 3,
  },
  flame: {
    position: 'absolute',
    zIndex: 10,
  },
  lightning: {
    position: 'absolute',
    zIndex: 10,
  },
  spark: {
    position: 'absolute',
    zIndex: 10,
  },
});
