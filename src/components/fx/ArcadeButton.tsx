import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Platform, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { SwordClash } from './SwordClash';

type ArcadeButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: any;
  textStyle?: any;
  showSwords?: boolean; // Enable sword clash animation
  isActive?: boolean; // Control animation state
  fullWidth?: boolean;
  minWidth?: number;
};

export const ArcadeButton: React.FC<ArcadeButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  style,
  textStyle,
  showSwords = false,
  isActive = false,
  fullWidth = false,
  minWidth,
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const neonPulse = React.useRef(new Animated.Value(0)).current;
  const [hover, setHover] = React.useState(false);

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };
  React.useEffect(() => {
    if (variant !== 'primary') {
      neonPulse.setValue(0);
    }

    // start premium sheen/sparkle animation only for premium variant
    // handled below in premiumPulse

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(neonPulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: false,
        }),
        Animated.timing(neonPulse, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: false,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [neonPulse, variant]);

  // Premium sheen animation
  const premiumPulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (variant !== 'premium') {
      premiumPulse.setValue(0);
      return;
    }
    const pLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(premiumPulse, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(premiumPulse, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ])
    );
    pLoop.start();
    return () => pLoop.stop();
  }, [premiumPulse, variant]);

  const bg =
    variant === 'primary' ? { backgroundColor: COLORS.primary } :
    variant === 'danger' ? { backgroundColor: COLORS.error } :
    variant === 'premium' ? { backgroundColor: 'transparent' } :
    { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.primary };

  const sz = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const textColor = variant === 'ghost' ? COLORS.primary : COLORS.white;
  const shadowColor = variant === 'danger' ? COLORS.error : COLORS.primary;

  const boxShadow = {
    shadowColor,
    shadowOpacity: variant === 'primary' ? 0.85 : 0.6 * (hover ? 1 : 0.5),
    shadowRadius: variant === 'primary' ? 20 : 12,
    shadowOffset: { width: 0, height: 0 },
    // web fallback
    ...(Platform.OS === 'web' ? { boxShadow: `0 0 ${hover ? 20 : 12}px ${shadowColor}66` } : {}),
  } as ViewStyle;

  const neonGlow = neonPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const neonSheen = neonPulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.8] });
  const premiumSheen = premiumPulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.9] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={fullWidth ? styles.pressableFullWidth : styles.pressableCentered}
    >
      <Animated.View
        style={[
          styles.base,
          sz,
          boxShadow,
          fullWidth ? styles.baseFullWidth : undefined,
          typeof minWidth === 'number' ? { minWidth } : undefined,
          style,
          variant !== 'primary' ? bg : undefined,
          { transform: [{ scale }] },
        ]}
      >
        {variant === 'primary' && (
          <>
            <LinearGradient
              colors={['#0f172a', '#31186a', '#54007b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            />
            <LinearGradient
              colors={['rgba(180, 255, 255, 0.18)', 'rgba(76, 209, 255, 0.28)', 'rgba(255, 112, 221, 0.18)']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={[styles.gradient, { opacity: 0.7 }]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.neonEdge,
                {
                  opacity: neonSheen,
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.neonGlow,
                {
                  opacity: neonGlow,
                },
              ]}
            />
          </>
        )}
        {variant === 'premium' && (
          <>
            <LinearGradient
              colors={['#ffd36b', '#f7c548', '#d4af37']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradient, { opacity: 1 }]}
            />
            {/* polish sheen removed per request; sparkles retained */}
            {/* sparkles - three small pulsing dots */}
            <Animated.View pointerEvents="none" style={[styles.sparkle, styles.sparkleA, { opacity: premiumSheen }]} />
            <Animated.View pointerEvents="none" style={[styles.sparkle, styles.sparkleB, { opacity: premiumSheen.interpolate({ inputRange: [0,1], outputRange: [0,1] }) }]} />
            <Animated.View pointerEvents="none" style={[styles.sparkle, styles.sparkleC, { opacity: premiumSheen.interpolate({ inputRange: [0,1], outputRange: [0.6,0.05] }) }]} />
          </>
        )}
        <View style={styles.innerContent}>
          {!!iconLeft && <View style={{ marginRight: 6 }}>{iconLeft}</View>}
          {showSwords && (
            <View style={styles.swordWrap}>
              <SwordClash
                isActive={isActive}
                size={Platform.OS === 'web'
                  ? (size === 'lg' ? 20 : size === 'sm' ? 12 : 16)
                  : (size === 'lg' ? 34 : size === 'sm' ? 18 : 26)}
                shape={Platform.OS === 'web' ? 'parallel' : 'plus'}
              />
            </View>
          )}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
          {!!iconRight && <View style={{ marginLeft: 8 }}>{iconRight}</View>}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableCentered: {
    alignSelf: 'center',
  },
  pressableFullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  base: {
    paddingHorizontal: 28,
    minWidth: 180,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseFullWidth: {
    width: '100%',
  },
  sm: { height: 40 },
  md: { height: 52 },
  lg: { height: 62 },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(55, 244, 255, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  neonEdge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#65f5ff',
    borderRadius: 18,
  },
  neonGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: 'rgba(112, 242, 255, 0.25)',
    shadowColor: '#70f2ff',
    shadowOpacity: 0.8,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  premiumSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ rotate: '15deg' }],
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#fff9e6',
    shadowColor: '#fff9e6',
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  sparkleA: { top: 8, left: 16, transform: [{ scale: 1.1 }] },
  sparkleB: { top: 6, right: 22, transform: [{ scale: 0.9 }] },
  sparkleC: { bottom: 10, left: 24, transform: [{ scale: 0.8 }] },
  premiumOverlay: {
    position: 'absolute',
    width: '120%',
    height: '160%',
    left: '-10%',
    top: -40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    shadowColor: '#fff',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  swordWrap: {
    marginRight: 4,
    paddingRight: 2,
    transform: [{ translateY: -1 }],
  },
});
