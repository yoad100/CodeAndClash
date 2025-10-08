import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface SnowBlizzardProps {
  countdown: number;
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

export const SnowBlizzard: React.FC<SnowBlizzardProps> = ({ countdown, onComplete }) => {
  const snowflakes = useRef<Snowflake[]>([]);
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);
  const countdownPulse = useRef(new Animated.Value(1)).current;
  const blizzardOpacity = useRef(new Animated.Value(0)).current;
  
  // Animate entrance
  useEffect(() => {
    Animated.timing(blizzardOpacity, {
      toValue: 1,
      duration: 800,
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
    <Animated.View style={[styles.container, { opacity: blizzardOpacity }]}>
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
      
      {/* Countdown display */}
      <View style={styles.countdownContainer}>
        <Text style={styles.frozenLabel}>FROZEN</Text>
        <Animated.Text 
          style={[
            styles.countdownText, 
            { 
              transform: [{ scale: countdownPulse }],
              color: countdown <= 3 ? '#FF4444' : '#0066CC' // Red when urgent
            }
          ]}
        >
          {countdown}
        </Animated.Text>
        <Text style={styles.secondsLabel}>seconds</Text>
      </View>
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
  countdownContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frozenLabel: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E90FF', // Dodger blue
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 10,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#0066CC', // Strong blue
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    lineHeight: 80,
  },
  secondsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4169E1', // Royal blue
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 5,
  },
});