import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  timeLeft: number;
  playerName?: string;
  totalDuration?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const FreezeOverlayMobile: React.FC<Props> = ({ timeLeft, playerName = 'You', totalDuration }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const totalSeconds = Math.max(1, Math.min(15, totalDuration ?? 15));
  const normalizedInitial = Math.max(0, Math.min(1, timeLeft / totalSeconds));
  const progressAnim = useRef(new Animated.Value(normalizedInitial)).current;
  const { height } = Dimensions.get('window');

  const ringSize = 128;
  const ringStroke = 6;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  
  // Create multiple snow particles
  const snowflakes = useRef(
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      fall: new Animated.Value(0),
      sway: new Animated.Value(0),
      opacity: new Animated.Value(Math.random() * 0.8 + 0.2),
      size: Math.random() * 8 + 4,
      left: Math.random() * 100, // percentage
      delay: Math.random() * 3000,
    }))
  ).current;

  useEffect(() => {
    // Fade in the overlay
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Shake effect for freeze impact
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // Pulse animation for countdown
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Animate snowflakes
    const snowAnimations = snowflakes.map((flake) => {
      const fallAnimation = Animated.loop(
        Animated.timing(flake.fall, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        })
      );

      const swayAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(flake.sway, {
            toValue: 1,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(flake.sway, {
            toValue: -1,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Start with delay
      setTimeout(() => {
        fallAnimation.start();
        swayAnimation.start();
      }, flake.delay);

      return () => {
        fallAnimation.stop();
        swayAnimation.stop();
      };
    });

    return () => {
      pulseAnimation.stop();
      snowAnimations.forEach(cleanup => cleanup());
    };
  }, []);

  useEffect(() => {
    const next = Math.max(0, Math.min(1, timeLeft / totalSeconds));
    Animated.timing(progressAnim, {
      toValue: next,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [timeLeft, totalSeconds]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Animated.View 
      style={[
        styles.overlay, 
        { 
          opacity: fadeAnim,
          transform: [{ translateX: shakeAnim }]
        }
      ]}
    >
      {/* Frost background */}
      <View style={styles.frostBackground} />
      
      {/* Snowflakes */}
      {snowflakes.map((flake) => {
        const translateY = flake.fall.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, height + 50],
        });
        
        const translateX = flake.sway.interpolate({
          inputRange: [-1, 1],
          outputRange: [-30, 30],
        });

        return (
          <Animated.View
            key={flake.id}
            style={[
              styles.snowflake,
              {
                left: `${flake.left}%`,
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity,
                transform: [
                  { translateY },
                  { translateX },
                ],
              },
            ]}
          />
        );
      })}

      {/* Freeze message */}
      <View style={styles.messageContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={styles.frozenTitle}>❄️ FROZEN ❄️</Text>
          <Text style={styles.frozenSubtitle}>{playerName} answered incorrectly</Text>
          <View style={styles.countdownContainer}>
            <View style={styles.timerRingWrapper}>
              <Svg width={ringSize} height={ringSize}>
                <Defs>
                  <LinearGradient id="freezeRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#96e3ff" stopOpacity="0.9" />
                    <Stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.9" />
                  </LinearGradient>
                </Defs>
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={ringStroke}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeLinecap="round"
                  fill="transparent"
                />
                <AnimatedCircle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke="url(#freezeRing)"
                  strokeWidth={ringStroke}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  rotation={-90}
                  origin={`${ringSize / 2}, ${ringSize / 2}`}
                />
              </Svg>
              <View style={styles.timerInnerShadow} />
              <Text style={styles.countdownText}>{Math.max(0, timeLeft)}</Text>
            </View>
            <Text style={styles.countdownLabel}>seconds</Text>
          </View>
        </Animated.View>
      </View>

      {/* Ice crystals decoration */}
      <View style={styles.iceDecoration}>
        <Text style={styles.iceCrystal}>❅</Text>
        <Text style={[styles.iceCrystal, styles.iceCrystal2]}>❆</Text>
        <Text style={[styles.iceCrystal, styles.iceCrystal3]}>❅</Text>
        <Text style={[styles.iceCrystal, styles.iceCrystal4]}>❆</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  frostBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 24, 43, 0.55)', // Frosted veil
  },
  snowflake: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 100,
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  messageContainer: {
    backgroundColor: 'rgba(0, 50, 100, 0.9)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#87CEEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  frozenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#87CEEB',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  frozenSubtitle: {
    fontSize: 14,
    color: '#B0E0E6',
    textAlign: 'center',
    marginBottom: 16,
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  timerRingWrapper: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timerInnerShadow: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(4, 27, 47, 0.65)',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  countdownText: {
    position: 'absolute',
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  countdownLabel: {
    fontSize: 14,
    color: '#C4F1FF',
    fontWeight: '600',
  },
  iceDecoration: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  iceCrystal: {
    position: 'absolute',
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.6)',
    textShadowColor: 'rgba(135, 206, 235, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  iceCrystal2: {
    top: '20%',
    right: '10%',
    fontSize: 20,
  },
  iceCrystal3: {
    bottom: '25%',
    left: '15%',
    fontSize: 18,
  },
  iceCrystal4: {
    top: '60%',
    right: '20%',
    fontSize: 22,
  },
});

export default FreezeOverlayMobile;