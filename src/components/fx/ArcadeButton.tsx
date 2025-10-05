import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Platform, Animated, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SwordClash } from './SwordClash';

type ArcadeButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  showSwords?: boolean; // Enable sword clash animation
  isActive?: boolean; // Control animation state
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
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const glow = React.useRef(new Animated.Value(0)).current;
  const [hover, setHover] = React.useState(false);

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };

  React.useEffect(() => {
    Animated.timing(glow, { toValue: hover ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [hover]);

  const bg =
    variant === 'primary' ? { backgroundColor: COLORS.primary } :
    variant === 'danger' ? { backgroundColor: COLORS.error } :
    { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.primary };

  const sz = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const textColor = variant === 'ghost' ? COLORS.primary : COLORS.white;
  const shadowColor = variant === 'danger' ? COLORS.error : COLORS.primary;

  const boxShadow = {
    shadowColor,
    shadowOpacity: 0.6 * (hover ? 1 : 0.5),
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    // web fallback
    ...(Platform.OS === 'web' ? { boxShadow: `0 0 ${hover ? 20 : 12}px ${shadowColor}66` } : {}),
  } as ViewStyle;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        alignSelf: 'center',
      }}
    >
      <Animated.View style={[styles.base, sz, bg, boxShadow, { transform: [{ scale }] }, style]}>
        {!!iconLeft && <View style={{ marginRight: 8 }}>{iconLeft}</View>}
        {showSwords && (
          <View style={{ marginRight: 8 }}>
            <SwordClash
              isActive={isActive}
              size={size === 'lg' ? 20 : size === 'sm' ? 12 : 16}
              shape="parallel"
            />
          </View>
        )}
        <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        {!!iconRight && <View style={{ marginLeft: 8 }}>{iconRight}</View>}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 28,
    minWidth: 180,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sm: { height: 40 },
  md: { height: 52 },
  lg: { height: 62 },
  text: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
});
