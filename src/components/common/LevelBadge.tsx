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
  const lightning2 = React.useRef(new Animated.Value(0)).current;
  const lightning3 = React.useRef(new Animated.Value(0)).current;
  const spark = React.useRef(new Animated.Value(0)).current;
  const spark2 = React.useRef(new Animated.Value(0)).current;
  const spark3 = React.useRef(new Animated.Value(0)).current;
  const leaf1 = React.useRef(new Animated.Value(0)).current;
  const leaf2 = React.useRef(new Animated.Value(0)).current;

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

    // Lightning animations for Guru level (refactored for realism and slower cadence)
    const lightningAnim = Animated.loop(
      Animated.sequence([
        Animated.delay(2200), // longer quiet period
        // initial bright flash
        Animated.timing(lightning, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(lightning, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        // short afterglow
        Animated.delay(1600),
      ])
    );

    const lightning2Anim = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(lightning2, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(lightning2, { toValue: 0, duration: 360, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(2200),
      ])
    );

    const lightning3Anim = Animated.loop(
      Animated.sequence([
        Animated.delay(4200),
        Animated.timing(lightning3, { toValue: 1, duration: 240, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(lightning3, { toValue: 0, duration: 480, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(3000),
      ])
    );

    // Spark animation for high-tier levels
    // Distinguished spark loops - slower, bigger, layered
    const sparkAnim = Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(spark, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(spark, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(1000),
      ])
    );

    const spark2Anim = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(spark2, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(spark2, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(1100),
      ])
    );

    const spark3Anim = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(spark3, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(spark3, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(1400),
      ])
    );

      // Staff leaves float more slowly and organically
      const leaf1Anim = Animated.loop(
        Animated.sequence([
          Animated.timing(leaf1, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(leaf1, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );

      const leaf2Anim = Animated.loop(
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(leaf2, { toValue: 1, duration: 9200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(leaf2, { toValue: 0, duration: 9200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );

    shimmerAnim.start();
    pulseAnim.start();
    orbitAnim.start();
    flame1Anim.start();
    flame2Anim.start();
    flame3Anim.start();
    lightningAnim.start();
    lightning2Anim.start();
    lightning3Anim.start();
    sparkAnim.start();
    spark2Anim.start();
    spark3Anim.start();
    leaf1Anim.start();
    leaf2Anim.start();

    return () => {
      shimmerAnim.stop();
      pulseAnim.stop();
      orbitAnim.stop();
      flame1Anim.stop();
      flame2Anim.stop();
      flame3Anim.stop();
      lightningAnim.stop();
      lightning2Anim.stop();
      lightning3Anim.stop();
      sparkAnim.stop();
      spark2Anim.stop();
      spark3Anim.stop();
      leaf1Anim.stop();
      leaf2Anim.stop();
    };
  }, [orbit, pulse, shimmer, flame1, flame2, flame3, lightning, lightning2, lightning3, spark, spark2, spark3, leaf1, leaf2]);

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
  const lightningScale = lightning.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.8] });
  const lightning2Opacity = lightning2.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] });
  const lightning2Scale = lightning2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.0] });
  const lightning3Opacity = lightning3.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] });
  const lightning3Scale = lightning3.interpolate({ inputRange: [0, 1], outputRange: [0.7, 3.2] });

  // Spark animation for Distinguished and high tiers
  const sparkOpacity = spark.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
  const sparkScale = spark.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] });
  const sparkRotate = spark.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const spark2Opacity = spark2.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const spark2Scale = spark2.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.2] });
  const spark3Opacity = spark3.interpolate({ inputRange: [0, 1], outputRange: [0, 0.95] });
  const spark3Scale = spark3.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] });

  // Leaves for Staff
  const leaf1Y = leaf1.interpolate({ inputRange: [0, 1], outputRange: [0, -26] });
  const leaf1X = leaf1.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const leaf1Rot = leaf1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '16deg'] });
  const leaf1Opacity = leaf1.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 1, 0.6] });

  const leaf2Y = leaf2.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const leaf2X = leaf2.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const leaf2Rot = leaf2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-12deg'] });
  const leaf2Opacity = leaf2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.6] });
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
          {/* primary large flash */}
          <Animated.View
            style={[
              styles.lightning,
              {
                top: compact ? -12 : -14,
                left: '18%',
                opacity: lightningOpacity,
                transform: [{ scale: lightningScale }],
              },
            ]}
          >
            {/* pale lavender core to match Guru gradient */}
            <Ionicons name="flash" size={compact ? 18 : 26} color="#f3e8ff" />
            <Ionicons name="flash" size={compact ? 14 : 18} color="#a78bfa" style={{ position: 'absolute', left: 2, top: 2, opacity: 0.95 }} />
          </Animated.View>

          {/* secondary mid flash, slightly delayed and rotated for depth */}
          <Animated.View
            style={[
              styles.lightning,
              {
                top: compact ? -6 : -8,
                right: '22%',
                opacity: lightning2Opacity,
                transform: [{ scale: lightning2Scale }, { rotate: '12deg' }],
              },
            ]}
          >
            <Ionicons name="flash" size={compact ? 14 : 20} color="#efe7ff" />
            <Ionicons name="flash" size={compact ? 10 : 14} color="#7c3aed" style={{ position: 'absolute', left: 1, top: 1, opacity: 0.9 }} />
          </Animated.View>

          {/* tertiary distant flash for slow afterglow */}
          <Animated.View
            style={[
              styles.lightning,
              {
                bottom: compact ? -10 : -12,
                left: '8%',
                opacity: lightning3Opacity,
                transform: [{ scale: lightning3Scale }, { rotate: '-22deg' }],
              },
            ]}
          >
            <Ionicons name="flash" size={compact ? 12 : 18} color="#f7f0ff" />
            <Ionicons name="flash" size={compact ? 9 : 12} color="#7c3aed" style={{ position: 'absolute', left: 1, top: 1, opacity: 0.85 }} />
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
                opacity: Animated.add(sparkOpacity, 0.15),
                transform: [{ scale: Animated.multiply(sparkScale, 1.25) }, { rotate: sparkRotate }],
              },
            ]}
          >
            <Ionicons name="sparkles" size={compact ? 14 : 20} color="#bfdbfe" />
            <Ionicons name="sparkles" size={compact ? 10 : 14} color="#60a5fa" style={{ position: 'absolute', left: 2, top: 2, opacity: 0.9 }} />
          </Animated.View>
          {/* layered additional spark */}
          <Animated.View
            style={[
              styles.spark,
              {
                top: compact ? -10 : -12,
                left: '10%',
                opacity: Animated.multiply(spark2Opacity, 0.9),
                transform: [{ scale: Animated.multiply(spark2Scale, 1.15) }, { rotate: sparkRotateNeg }],
              },
            ]}
          >
            <Ionicons name="sparkles" size={compact ? 12 : 18} color="#e0f2fe" />
            <Ionicons name="sparkles" size={compact ? 9 : 12} color="#93c5fd" style={{ position: 'absolute', left: 1, top: 1, opacity: 0.88 }} />
          </Animated.View>
          <Animated.View
            style={[
              styles.spark,
              {
                bottom: compact ? -10 : -12,
                right: '6%',
                opacity: Animated.multiply(spark3Opacity, 0.85),
                transform: [{ scale: Animated.multiply(spark3Scale, 1.05) }, { rotate: sparkRotate }],
              },
            ]}
          >
            <Ionicons name="star" size={compact ? 10 : 14} color="#bfdbfe" />
            <Ionicons name="star" size={compact ? 7 : 10} color="#60a5fa" style={{ position: 'absolute', left: 1, top: 1, opacity: 0.9 }} />
          </Animated.View>
          <Animated.View
            style={[
              styles.spark,
              {
                bottom: compact ? -6 : -8,
                left: '15%',
                opacity: Animated.add(Animated.multiply(sparkOpacity, 0.85), 0.05),
                transform: [{ scale: Animated.multiply(sparkScale, 1.1) }, { rotate: sparkRotate }],
              },
            ]}
          >
            <Ionicons name="star" size={compact ? 12 : 16} color="#60a5fa" />
            <Ionicons name="star" size={compact ? 8 : 12} color="#93c5fd" style={{ position: 'absolute', left: 1, top: 1, opacity: 0.9 }} />
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
