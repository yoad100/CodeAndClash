import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../constants/colors';

type Props = { leftName: string; rightName: string; onDone: () => void };

export const VsSplash: React.FC<Props> = ({ leftName, rightName, onDone }) => {
  const slideL = React.useRef(new Animated.Value(-200)).current;
  const slideR = React.useRef(new Animated.Value(200)).current;
  const vsScale = React.useRef(new Animated.Value(0.5)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(slideL, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideR, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.spring(vsScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 12 }),
      Animated.delay(700),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrap, { opacity }] }>
      <Animated.Text style={[styles.name, styles.left, { transform: [{ translateX: slideL }] }]}>{leftName}</Animated.Text>
      <Animated.Text style={[styles.vs, { transform: [{ scale: vsScale }] }]}>VS</Animated.Text>
      <Animated.Text style={[styles.name, styles.right, { transform: [{ translateX: slideR }] }]}>{rightName}</Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#000000CC', alignItems: 'center', justifyContent: 'center' },
  name: { color: COLORS.white, fontSize: 28, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  left: { position: 'absolute', left: 24 },
  right: { position: 'absolute', right: 24 },
  vs: { color: COLORS.secondary, fontSize: 64, fontWeight: '900' },
});
