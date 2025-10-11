import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface SnowBlizzardProps {
  countdown: number;
  playerName?: string;
  onComplete?: () => void;
}

interface Snowflake {
  x: Animated.Value;
  y: Animated.Value;
  size: number;
  opacity: number;
  speed: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const SnowBlizzard: React.FC<SnowBlizzardProps> = ({ countdown, playerName = 'You', onComplete }) => {
  const snowflakes = useRef<Snowflake[]>([]);
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);
  const countdownPulse = useRef(new Animated.Value(1)).current;
  const blizzardOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const messageScale = useRef(new Animated.Value(0.8)).current;
  
  // Animate entrance
  useEffect(() => {
    // Fade in overlay
    Animated.timing(blizzardOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    // Shake effect for freeze impact
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    
    // Pop in message box
    Animated.spring(messageScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate countdown pulse
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(countdownPulse, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(countdownPulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    
    return () => pulse.stop();
  }, []);
  
  // Create snowflakes
  useEffect(() => {
    const createSnowflakes = () => {
      const flakes: Snowflake[] = [];
      
      // Create 60 snowflakes for a dense blizzard effect
      for (let i = 0; i < 60; i++) {
        flakes.push({
          x: new Animated.Value(Math.random() * screenWidth),
          y: new Animated.Value(-20 - Math.random() * 200),
          size: 1.5 + Math.random() * 5, // Size between 1.5-6.5
          opacity: 0.2 + Math.random() * 0.6, // Opacity between 0.2-0.8
          speed: 800 + Math.random() * 2500, // Duration between 0.8-3.3 seconds
        });
      }
      
      snowflakes.current = flakes;
    };

    createSnowflakes();
  }, []);

  // Animate snowflakes
  useEffect(() => {
    const animateSnowfall = () => {
      const animations = snowflakes.current.map((flake, index) => {
        const fallAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(flake.y, {
              toValue: screenHeight + 50,
              duration: flake.speed,
              useNativeDriver: true,
            }),
            Animated.timing(flake.y, {
              toValue: -20,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );

        // Add horizontal drift for more realistic snow
        const baseX = Math.random() * screenWidth;
        const driftAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(flake.x, {
              toValue: baseX + 50,
              duration: flake.speed / 2,
              useNativeDriver: true,
            }),
            Animated.timing(flake.x, {
              toValue: baseX - 50,
              duration: flake.speed / 2,
              useNativeDriver: true,
            }),
          ])
        );

        // Start animations with random delays
        setTimeout(() => {
          fallAnimation.start();
          driftAnimation.start();
        }, Math.random() * 2000);

        return fallAnimation;
      });

      animationRefs.current = animations;
    };

    animateSnowfall();

    return () => {
      // Cleanup animations
      animationRefs.current.forEach(animation => animation.stop());
    };
  }, []);

  // Handle countdown completion
  useEffect(() => {
    if (countdown <= 0 && onComplete) {
      onComplete();
    }
  }, [countdown, onComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: blizzardOpacity, transform: [{ translateX: shakeAnim }] }]}>
      {/* Snow particles */}
      {snowflakes.current.map((flake, index) => (
        <Animated.View
          key={index}
          style={[
            styles.snowflake,
            {
              transform: [
                { translateX: flake.x },
                { translateY: flake.y },
              ],
              width: flake.size,
              height: flake.size,
              opacity: flake.opacity,
            },
          ]}
        />
      ))}
      
      {/* Blizzard overlay for atmospheric effect */}
      <View style={styles.blizzardOverlay} />
      
      {/* Additional wind effect overlay */}
      <View style={styles.windOverlay} />
      
      {/* Ice crystals decoration */}
      <View style={styles.iceDecoration}>
        <Text style={styles.iceCrystal}>❅</Text>
        <Text style={[styles.iceCrystal, styles.iceCrystal2]}>❆</Text>
        <Text style={[styles.iceCrystal, styles.iceCrystal3]}>❅</Text>
        <Text style={[styles.iceCrystal, styles.iceCrystal4]}>❆</Text>
      </View>
      
      {/* Freeze message box */}
      <Animated.View style={[styles.messageContainer, { transform: [{ scale: messageScale }] }]}>
        <Animated.View style={{ transform: [{ scale: countdownPulse }] }}>
          <Text style={styles.frozenTitle}>❄️ FROZEN ❄️</Text>
          <Text style={styles.frozenSubtitle}>{playerName} answered incorrectly</Text>
          <View style={styles.countdownBox}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.secondsLabel}>seconds</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(173, 216, 230, 0.1)', // Light blue tint
    zIndex: 1000,
    pointerEvents: 'none', // Allow interaction through the snow effect
  },
  snowflake: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  blizzardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.8,
  },
  windOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(173, 216, 230, 0.03)',
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
  messageContainer: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
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
    minWidth: 250,
  },
  frozenTitle: {
    fontSize: 28,
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
  countdownBox: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 48,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  secondsLabel: {
    fontSize: 14,
    color: '#B0E0E6',
    marginTop: 4,
    fontWeight: '600',
  },
});