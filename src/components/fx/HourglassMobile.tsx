import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../constants/colors';

interface Props {
  label?: string;
  durationMs?: number;
  loop?: boolean;
  showCountdown?: boolean;
  size?: number;
}

export const HourglassMobile: React.FC<Props> = ({ 
  size = 120, 
  label = "Loading", 
  durationMs = 10000, 
  loop = true, 
  showCountdown = true 
}) => {
  const sandProgress = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const timeLeft = useRef(Math.floor(durationMs / 1000));
  const [countdown, setCountdown] = React.useState(timeLeft.current);

  useEffect(() => {
    // Sand animation
    const sandAnimation = Animated.timing(sandProgress, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: false, // We need layout animations for height
    });

    // Glow pulse animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Start animations
    glowAnimation.start();
    
    if (loop) {
      const loopAnimation = Animated.loop(
        Animated.sequence([
          sandAnimation,
          Animated.timing(sandProgress, { toValue: 0, duration: 500, useNativeDriver: false }),
          Animated.delay(400),
        ])
      );
      loopAnimation.start();
    } else {
      sandAnimation.start();
    }

    // Countdown timer
    let interval: ReturnType<typeof setInterval>;
    if (showCountdown) {
      interval = setInterval(() => {
        timeLeft.current -= 1;
        setCountdown(timeLeft.current);
        if (timeLeft.current <= 0) {
          timeLeft.current = Math.floor(durationMs / 1000);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      sandAnimation.stop();
      glowAnimation.stop();
    };
  }, [durationMs, loop, showCountdown]);

  const topSandHeight = sandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [size * 0.35, 0],
  });

  const bottomSandHeight = sandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size * 0.35],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <View style={styles.container}>
      {/* Outer glow */}
      <Animated.View 
        style={[
          styles.glow, 
          { 
            width: size * 1.3, 
            height: size * 1.3,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }]
          }
        ]} 
      />
      
      {/* Hourglass frame */}
      <View style={[styles.frame, { width: size, height: size }]}>
        {/* Top bulb outline */}
        <View style={[styles.topBulb, { width: size * 0.8, height: size * 0.35 }]}>
          {/* Top sand */}
          <Animated.View 
            style={[
              styles.sand, 
              styles.topSand,
              { height: topSandHeight }
            ]} 
          />
        </View>

        {/* Neck */}
        <View style={[styles.neck, { width: size * 0.15, height: size * 0.3 }]} />

        {/* Bottom bulb outline */}
        <View style={[styles.bottomBulb, { width: size * 0.8, height: size * 0.35 }]}>
          {/* Bottom sand */}
          <Animated.View 
            style={[
              styles.sand, 
              styles.bottomSand,
              { height: bottomSandHeight }
            ]} 
          />
        </View>
      </View>

      {/* Label and countdown */}
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {showCountdown && (
          <Text style={styles.countdown}>{countdown}s</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  glow: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  frame: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  topBulb: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 40,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bottomBulb: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 40,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  neck: {
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  sand: {
    backgroundColor: COLORS.warning,
    width: '100%',
    borderRadius: 2,
  },
  topSand: {
    // Sand falls from top
  },
  bottomSand: {
    // Sand accumulates at bottom
  },
  textContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  countdown: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default HourglassMobile;