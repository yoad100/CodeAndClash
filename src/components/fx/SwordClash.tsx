import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../constants/colors';
import KatanaBlade from './KatanaBlade';

type Props = {
  isActive?: boolean;
  size?: number;
  // 'plus' => left 0°, right 90°; 'parallel' => both 0° (vertical)
  shape?: 'plus' | 'parallel';
};

export const SwordClash: React.FC<Props> = ({ isActive = false, size = 24, shape = 'plus' }) => {
  // Core motion values
  const leftSword = React.useRef(new Animated.Value(0)).current; // 0=offscreen, 1=impact
  const rightSword = React.useRef(new Animated.Value(0)).current; // 0=offscreen, 1=impact
  const recoil = React.useRef(new Animated.Value(0)).current; // kept but damped for strict plus
  const sparks = React.useRef(new Animated.Value(0)).current; // particle burst 0->1
  const flash = React.useRef(new Animated.Value(0)).current; // impact flash 0->1
  const glint = React.useRef(new Animated.Value(0)).current; // blade specular sweep 0->1
  const glow = React.useRef(new Animated.Value(0)).current; // ambient aura

  React.useEffect(() => {
    if (isActive) {
      // Main clash loop: approach -> impact (recoil+flash+sparks) -> retreat -> pause
      const approach = Animated.parallel([
        Animated.timing(leftSword, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rightSword, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      const impact = Animated.parallel([
        // Minimal recoil to preserve strict cross shape
        Animated.sequence([
          Animated.timing(recoil, { toValue: 1, duration: 40, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(recoil, { toValue: 0, duration: 60, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.delay(120), // hold cross briefly
        ]),
        Animated.sequence([
          Animated.timing(flash, {
            toValue: 1,
            duration: 90,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(flash, {
            toValue: 0,
            duration: 160,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(sparks, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(sparks, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]),
      ]);

      const retreat = Animated.parallel([
        Animated.timing(leftSword, {
          toValue: 0,
          duration: 520,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rightSword, {
          toValue: 0,
          duration: 520,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      const cycle = Animated.loop(
        Animated.sequence([
          approach,
          impact,
          retreat,
          Animated.delay(900),
        ])
      );

      const glowPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      const glintSweep = Animated.loop(
        Animated.sequence([
          Animated.timing(glint, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(glint, { toValue: 0, duration: 200, easing: Easing.linear, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );

      cycle.start();
      glowPulse.start();
      glintSweep.start();

      return () => {
        cycle.stop();
        glowPulse.stop();
        glintSweep.stop();
      };
    }

    // Reset to idle state
    leftSword.setValue(0);
    rightSword.setValue(0);
    recoil.setValue(0);
    sparks.setValue(0);
    flash.setValue(0);
    glint.setValue(0);
    glow.setValue(0);
  }, [isActive]);

  // Geometry & transforms
  const approachOffset = size * 0.55;
  // Impact formation based on shape, with symmetric 35° approach arcs
  const leftEndAngle = 0;
  const rightEndAngle = shape === 'plus' ? 90 : 0;
  const leftStartAngle = leftEndAngle - 35;   // approach arc: -35° -> end
  const rightStartAngle = rightEndAngle + 35; // approach arc: +35° -> end (mirrored)
  const recoilAngle = 10; // deg extra deflection on impact

  const leftTransform = {
    transform: [
      { translateX: leftSword.interpolate({ inputRange: [0, 1], outputRange: [-approachOffset, 0] }) },
      { rotate: leftSword.interpolate({ inputRange: [0, 1], outputRange: [`${leftStartAngle}deg`, `${leftEndAngle}deg`] }) },
      { rotate: recoil.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `-${recoilAngle}deg`] }) },
    ],
  };

  const rightTransform = {
    transform: [
      { translateX: rightSword.interpolate({ inputRange: [0, 1], outputRange: [approachOffset, 0] }) },
      { rotate: rightSword.interpolate({ inputRange: [0, 1], outputRange: [`${rightStartAngle}deg`, `${rightEndAngle}deg`] }) },
      { rotate: recoil.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${recoilAngle}deg`] }) },
      { scaleX: -1 }, // mirror for right side
    ],
  };

  const sparkScale = sparks.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  const sparkOpacity = sparks.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 0] });

  const glowStyle = {
    opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
  };

  const flashStyle = {
    opacity: flash,
    transform: [{ scale: flash.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] }) }],
  } as const;

  // Glint: sweep highlight across the blade
  const glintTranslate = glint.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.5, size * 0.5] });

  return (
    <View pointerEvents="none" style={[styles.container, { width: size * 2.2, height: size * 1.6 }]}> 
      {/* Ambient glow */}
      <Animated.View style={[styles.glow, glowStyle, { width: size * 2.8, height: size * 1.8 }]} />

      {/* Impact flash */}
      <Animated.View style={[styles.flash, flashStyle, { width: size * 0.9, height: size * 0.9 }]} />

      {/* Left sword */}
      <Animated.View style={[styles.sword, leftTransform, { left: size * 0.06 }]}> 
  {/* Blade (SVG curved) */}
  <KatanaBlade width={Math.max(12, size * 0.18)} height={size * 1.05} />
        {/* Cross guard */}
        <View style={[styles.crossGuard, { width: Math.max(18, size * 0.42), height: Math.max(10, size * 0.22) }]}>
          <View style={[styles.crossH, { height: Math.max(4, size * 0.08), borderRadius: Math.max(2, size * 0.04) }]} />
          <View style={[styles.crossV, { width: Math.max(4, size * 0.08), borderRadius: Math.max(2, size * 0.04) }]} />
        </View>
        {/* Grip */}
        <View style={[styles.grip, { height: Math.max(10, size * 0.36) }]}> 
          <View style={styles.gripWrap} />
        </View>
        {/* Pommel */}
        <View style={[styles.pommel, { width: Math.max(6, size * 0.22), height: Math.max(6, size * 0.22), borderRadius: Math.max(3, size * 0.11) }]} />
        {/* Motion afterimage (subtle) */}
        <Animated.View style={[styles.bladeGhost, { width: Math.max(12, size * 0.18), height: size * 1.05, opacity: leftSword.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0] }) }]} />
      </Animated.View>

      {/* Right sword */}
      <Animated.View style={[styles.sword, rightTransform, { right: size * 0.06 }]}> 
  <KatanaBlade width={Math.max(12, size * 0.18)} height={size * 1.05} tint={'#F43F5E'} />
        <View style={[styles.crossGuard, { width: Math.max(18, size * 0.42), height: Math.max(10, size * 0.22) }]}>
          <View style={[styles.crossH, { height: Math.max(4, size * 0.08), borderRadius: Math.max(2, size * 0.04) }]} />
          <View style={[styles.crossV, { width: Math.max(4, size * 0.08), borderRadius: Math.max(2, size * 0.04) }]} />
        </View>
        <View style={[styles.grip, { height: Math.max(10, size * 0.36) }]}> 
          <View style={styles.gripWrap} />
        </View>
        <View style={[styles.pommel, { width: Math.max(6, size * 0.22), height: Math.max(6, size * 0.22), borderRadius: Math.max(3, size * 0.11) }]} />
        <Animated.View style={[styles.bladeGhost, { width: Math.max(12, size * 0.18), height: size * 1.05, opacity: rightSword.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0] }) }]} />
      </Animated.View>

      {/* Sparks: sharp shards and embers */}
      <Animated.View style={[styles.sparks, { opacity: sparkOpacity, transform: [{ scale: sparkScale }] }]}> 
        {/* NW shard */}
        <Animated.View style={[styles.spark, { height: 6, transform: [{ translateX: sparks.interpolate({ inputRange: [0,1], outputRange: [0, -size * 0.42] }) }, { translateY: sparks.interpolate({ inputRange: [0,1], outputRange: [0, -size * 0.26] }) }, { rotate: '-25deg' }] }]} />
        {/* NE shard */}
        <Animated.View style={[styles.spark, { height: 6, transform: [{ translateX: sparks.interpolate({ inputRange: [0,1], outputRange: [0, size * 0.42] }) }, { translateY: sparks.interpolate({ inputRange: [0,1], outputRange: [0, -size * 0.22] }) }, { rotate: '25deg' }] }]} />
        {/* W ember */}
        <Animated.View style={[styles.spark, { transform: [{ translateX: sparks.interpolate({ inputRange: [0,1], outputRange: [0, -size * 0.5] }) }] }]} />
        {/* E ember */}
        <Animated.View style={[styles.spark, { transform: [{ translateX: sparks.interpolate({ inputRange: [0,1], outputRange: [0, size * 0.5] }) }] }]} />
        {/* SW shard */}
        <Animated.View style={[styles.spark, { height: 6, transform: [{ translateX: sparks.interpolate({ inputRange: [0,1], outputRange: [0, -size * 0.28] }) }, { translateY: sparks.interpolate({ inputRange: [0,1], outputRange: [0, size * 0.22] }) }, { rotate: '18deg' }] }]} />
        {/* SE shard */}
        <Animated.View style={[styles.spark, { height: 6, transform: [{ translateX: sparks.interpolate({ inputRange: [0,1], outputRange: [0, size * 0.32] }) }, { translateY: sparks.interpolate({ inputRange: [0,1], outputRange: [0, size * 0.25] }) }, { rotate: '-18deg' }] }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    backgroundColor: COLORS.secondary,
    borderRadius: 50,
    opacity: 0.3,
  },
  flash: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 999,
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  sword: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blade: {
    backgroundColor: COLORS.text,
    borderRadius: 3,
    overflow: 'hidden',
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.6,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  bladeRidge: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: -1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  glint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '0deg' }],
  },
  tip: {
    position: 'absolute',
    top: '50%',
    marginTop: -4,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftColor: COLORS.text,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  guard: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    marginTop: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.7,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  tsuba: {
    backgroundColor: '#d4af37',
    shadowColor: '#d4af37',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    marginTop: 3,
  },
  grip: {
    width: 7,
    backgroundColor: '#1f2937',
    borderRadius: 3,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gripWrap: {
    width: '80%',
    height: '70%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  pommel: {
    backgroundColor: COLORS.secondary,
    marginTop: 2,
  },
  bladeGhost: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    opacity: 0.15,
    borderRadius: 3,
  },
  crossGuard: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 3,
  },
  crossH: {
    position: 'absolute',
    width: '100%',
    backgroundColor: '#d4af37',
    shadowColor: '#d4af37',
    shadowOpacity: 0.7,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  crossV: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#d4af37',
    shadowColor: '#d4af37',
    shadowOpacity: 0.7,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  sparks: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    width: 2,
    height: 4,
    backgroundColor: COLORS.warning,
    borderRadius: 1.5,
    shadowColor: COLORS.warning,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
