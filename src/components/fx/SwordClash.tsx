import React from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import KatanaBlade from './KatanaBlade';

type Props = {
  isActive?: boolean;
  size?: number;
  shape?: 'plus' | 'parallel';
};

const SPARK_VECTORS = [
  { x: -0.52, y: -0.32, rotate: '-24deg', scale: 1.1 },
  { x: 0.54, y: -0.24, rotate: '22deg', scale: 1.0 },
  { x: -0.38, y: 0.32, rotate: '17deg', scale: 0.9 },
  { x: 0.46, y: 0.28, rotate: '-18deg', scale: 0.95 },
  { x: 0, y: -0.58, rotate: '0deg', scale: 0.8 },
] as const;

export const SwordClash: React.FC<Props> = ({ isActive = false, size = 24, shape = 'plus' }) => {
  const isWeb = Platform.OS === 'web';
  const approachValue = React.useRef(new Animated.Value(0)).current;
  const impactValue = React.useRef(new Animated.Value(0)).current;
  const shakeValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    let cycle: Animated.CompositeAnimation | null = null;

    if (isActive) {
      const approachDuration = isWeb ? 780 : 700;
      const impactRise = isWeb ? 210 : 190;
      const impactFall = isWeb ? 360 : 320;
      const retreatDuration = isWeb ? 620 : 560;
      const postImpactPause = isWeb ? 320 : 300;
      const resetPause = isWeb ? 720 : 660;

      const approach = Animated.timing(approachValue, {
        toValue: 1,
        duration: approachDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

      const impact = Animated.parallel([
        Animated.sequence([
          Animated.timing(impactValue, {
            toValue: 1,
            duration: impactRise,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(impactValue, {
            toValue: 0,
            duration: impactFall,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shakeValue, {
            toValue: 1,
            duration: 90,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: -1,
            duration: 110,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: 0,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);

      const retreat = Animated.timing(approachValue, {
        toValue: 0,
        duration: retreatDuration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      });

      cycle = Animated.loop(
        Animated.sequence([
          approach,
          impact,
          Animated.delay(postImpactPause),
          retreat,
          Animated.delay(resetPause),
        ])
      );
      cycle.start();
    } else {
      approachValue.setValue(0);
      impactValue.setValue(0);
      shakeValue.setValue(0);
    }

    return () => {
      cycle?.stop();
      approachValue.setValue(0);
      impactValue.setValue(0);
      shakeValue.setValue(0);
    };
  }, [approachValue, impactValue, isActive, isWeb, shakeValue]);

  const clashWidth = size * (shape === 'parallel' ? 1.7 : 1.95);
  const clashHeight = size * 1.85;
  const bladeWidth = Math.max(12, size * 0.18);
  const bladeHeight = size * 1.18;
  const guardWidth = Math.max(18, size * 0.42);
  const guardHeight = Math.max(10, size * 0.24);
  const handleHeight = Math.max(12, size * 0.38);
  const pommelSize = Math.max(6, size * 0.22);

  const approachDistance = size * (shape === 'parallel' ? 0.36 : 0.5);
  const arcLift = size * (shape === 'parallel' ? 0.12 : 0.38);
  const recoilAngle = shape === 'plus' ? 14 : 8;

  const leftBaseRotation = approachValue.interpolate({
    inputRange: [0, 1],
    outputRange: [shape === 'plus' ? -34 : -16, shape === 'plus' ? 0 : -2],
  });
  const leftRecoil = impactValue.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, -recoilAngle, 0],
  });
  const leftRotation = Animated.add(leftBaseRotation, leftRecoil).interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const rightImpactTarget = 0;
  const rightBaseRotation = approachValue.interpolate({
    inputRange: [0, 1],
    outputRange: [rightImpactTarget + 28, rightImpactTarget],
  });
  const rightRecoil = impactValue.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, recoilAngle, 0],
  });
  const rightRotation = Animated.add(rightBaseRotation, rightRecoil).interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const leftTranslateX = approachValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-approachDistance, 0],
  });
  const rightTranslateX = approachValue.interpolate({
    inputRange: [0, 1],
    outputRange: [approachDistance, 0],
  });
  const leftTranslateYBase = approachValue.interpolate({
    inputRange: [0, 1],
    outputRange: [shape === 'plus' ? arcLift : arcLift * 0.5, 0],
  });
  const rightTranslateYBase = approachValue.interpolate({
    inputRange: [0, 1],
    outputRange: [shape === 'plus' ? -arcLift : -arcLift * 0.5, 0],
  });
  const leftImpactLift = impactValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -size * 0.05, 0],
  });
  const rightImpactDrop = impactValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, size * 0.05, 0],
  });

  const leftTranslateY = Animated.add(leftTranslateYBase, leftImpactLift);
  const rightTranslateY = Animated.add(rightTranslateYBase, rightImpactDrop);

  const shakeStyle = {
    transform: [
      {
        translateX: shakeValue.interpolate({
          inputRange: [-1, 1],
          outputRange: [-size * 0.12, size * 0.12],
        }),
      },
      {
        translateY: shakeValue.interpolate({
          inputRange: [-1, 1],
          outputRange: [size * 0.06, -size * 0.06],
        }),
      },
    ],
  };

  const flashOpacity = impactValue.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.9, 0] });
  const flashScale = impactValue.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] });
  const sparkOpacity = impactValue.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] });
  const sparkScale = impactValue.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] });
  const ringScale = impactValue.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] });
  const ringOpacity = impactValue.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.8, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        shakeStyle,
        { width: clashWidth, height: clashHeight },
      ]}
    >
      <Animated.View
        style={[
          styles.flash,
          {
            opacity: flashOpacity,
            transform: [{ scale: flashScale }],
            width: size * 0.9,
            height: size * 0.9,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.impactRing,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
            width: size * 0.9,
            height: size * 0.9,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.sword,
          {
            left: size * 0.02,
            transform: [
              { translateX: leftTranslateX },
              { translateY: leftTranslateY },
              { rotate: leftRotation },
            ],
          },
        ]}
      >
        <KatanaBlade width={bladeWidth} height={bladeHeight} />
        <View style={[styles.guard, { width: guardWidth, height: guardHeight }]}>
          <View style={[styles.guardHorizontal, { height: Math.max(4, size * 0.08) }]} />
          <View style={[styles.guardVertical, { width: Math.max(4, size * 0.08) }]} />
        </View>
        <View style={[styles.handle, { height: handleHeight }]}>
          <View style={styles.handleWrap} />
          <View style={styles.handleWrapAlt} />
        </View>
        <View
          style={[
            styles.pommel,
            {
              width: pommelSize,
              height: pommelSize,
              borderRadius: pommelSize / 2,
            },
          ]}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sword,
          {
            right: size * 0.02,
            transform: [
              { translateX: rightTranslateX },
              { translateY: rightTranslateY },
              { rotate: rightRotation },
              { scaleX: -1 },
            ],
          },
        ]}
      >
        <KatanaBlade width={bladeWidth} height={bladeHeight} tint="#F43F5E" />
        <View style={[styles.guard, { width: guardWidth, height: guardHeight }]}>
          <View style={[styles.guardHorizontal, { height: Math.max(4, size * 0.08) }]} />
          <View style={[styles.guardVertical, { width: Math.max(4, size * 0.08) }]} />
        </View>
        <View style={[styles.handle, { height: handleHeight }]}>
          <View style={styles.handleWrap} />
          <View style={styles.handleWrapAlt} />
        </View>
        <View
          style={[
            styles.pommel,
            {
              width: pommelSize,
              height: pommelSize,
              borderRadius: pommelSize / 2,
            },
          ]}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sparkCluster,
          {
            opacity: sparkOpacity,
            transform: [{ scale: sparkScale }],
          },
        ]}
      >
        {SPARK_VECTORS.map((spark, index) => (
          <Animated.View
            key={`spark-${index}`}
            style={[
              styles.spark,
              {
                width: Math.max(2, size * 0.08),
                height: Math.max(4, size * 0.18 * spark.scale),
                transform: [
                  {
                    translateX: impactValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, spark.x * size],
                    }),
                  },
                  {
                    translateY: impactValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, spark.y * size],
                    }),
                  },
                  { rotate: spark.rotate },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  flash: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    shadowColor: '#ffd166',
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  impactRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 229, 128, 0.9)',
    borderRadius: 999,
    backgroundColor: 'transparent',
    shadowColor: '#ffef9f',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  sword: {
    position: 'absolute',
    alignItems: 'center',
  },
  guard: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#1d2735',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.6)',
    overflow: 'hidden',
  },
  guardHorizontal: {
    position: 'absolute',
    width: '100%',
    backgroundColor: '#f4d35e',
    shadowColor: '#f4d35e',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  guardVertical: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#f4d35e',
    shadowColor: '#f4d35e',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  handle: {
    width: 12,
    backgroundColor: '#101621',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  handleWrap: {
    position: 'absolute',
    width: '78%',
    height: '78%',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ rotate: '11deg' }],
  },
  handleWrapAlt: {
    position: 'absolute',
    width: '78%',
    height: '78%',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 190, 120, 0.12)',
    transform: [{ rotate: '-11deg' }],
  },
  pommel: {
    backgroundColor: '#f4d35e',
    marginTop: 4,
    shadowColor: '#f4d35e',
    shadowOpacity: 0.75,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  sparkCluster: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    backgroundColor: COLORS.warning,
    borderRadius: 999,
    shadowColor: COLORS.warning,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});

export default SwordClash;
