import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../constants/colors';

// Animated tri-color background with light opacity "blobs" that drift slowly.
export const NeonBackground: React.FC = () => {
  const t1 = React.useRef(new Animated.Value(0)).current;
  const t2 = React.useRef(new Animated.Value(0)).current;
  const t3 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const makeLoop = (val: Animated.Value, duration: number, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true, delay }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );

    const l1 = makeLoop(t1, 12000);
    const l2 = makeLoop(t2, 14000, 600);
    const l3 = makeLoop(t3, 16000, 1200);
    l1.start();
    l2.start();
    l3.start();
    return () => { l1.stop(); l2.stop(); l3.stop(); };
  }, []);

  const blob1 = {
    transform: [
      { translateX: t1.interpolate({ inputRange: [0, 1], outputRange: [-80, 80] }) },
      { translateY: t1.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] }) },
      { scale: t1.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.15] }) },
    ],
  } as const;
  const blob2 = {
    transform: [
      { translateX: t2.interpolate({ inputRange: [0, 1], outputRange: [90, -60] }) },
      { translateY: t2.interpolate({ inputRange: [0, 1], outputRange: [-60, 70] }) },
      { rotate: t2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '30deg'] }) },
      { scale: t2.interpolate({ inputRange: [0, 1], outputRange: [1.05, 1.2] }) },
    ],
  } as const;
  const blob3 = {
    transform: [
      { translateX: t3.interpolate({ inputRange: [0, 1], outputRange: [-40, 120] }) },
      { translateY: t3.interpolate({ inputRange: [0, 1], outputRange: [70, -50] }) },
      { rotate: t3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-25deg'] }) },
      { scale: t3.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] }) },
    ],
  } as const;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Animated color blobs (light opacity) */}
      <View style={styles.centerWrap}>
        <Animated.View style={[styles.blob, styles.blobPrimary, blob1]} />
        <Animated.View style={[styles.blob, styles.blobSecondary, blob2]} />
        <Animated.View style={[styles.blob, styles.blobAccent, blob3]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    opacity: 0.12, // lighter opacity for overlay use
    // soft shadow glow
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  blobPrimary: { backgroundColor: COLORS.primary },
  blobSecondary: { backgroundColor: COLORS.secondary },
  blobAccent: { backgroundColor: COLORS.glowPink },
});
