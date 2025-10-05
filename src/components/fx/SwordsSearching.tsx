import React from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { COLORS } from '../../constants/colors';
import KatanaBlade from './KatanaBlade';

export const SwordsSearching: React.FC<{ label?: string }>= ({ label = 'Finding Opponent' }) => {
  const rotL = React.useRef(new Animated.Value(0)).current;
  const rotR = React.useRef(new Animated.Value(0)).current;
  const glow = React.useRef(new Animated.Value(0)).current;
  const glint = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rotL, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(rotR, { toValue: -1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(rotL, { toValue: -1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(rotR, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(glow, { toValue: 1, duration: 120, useNativeDriver: false }),
            Animated.timing(glow, { toValue: 0, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(glint, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(glint, { toValue: 0, duration: 200, easing: Easing.linear, useNativeDriver: true }),
          ])
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Both katanas vertical at 0°
  const boxShadow = glow.interpolate({ inputRange: [0, 1], outputRange: ['0px 0px 0px #FFD70000', '0px 0px 20px #FFD70088'] });
  const glintX = glint.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });

  return (
    <View style={styles.wrap}>
  <Animated.View style={[styles.sword, { transform: [{ rotate: '0deg' }], zIndex: 2, boxShadow: (boxShadow as unknown) as any }]}>
        {/* Katana blade (SVG curved) */}
        <KatanaBlade width={14} height={96} />
        {/* Cross-shaped guard */}
        <View style={styles.crossGuard}>
          <View style={styles.crossH} />
          <View style={styles.crossV} />
        </View>
        {/* Long wrapped grip */}
        <View style={styles.kGrip}>
          <View style={styles.kWrap} />
        </View>
      </Animated.View>
  <Animated.View style={[styles.sword, { transform: [{ rotate: '0deg' }], zIndex: 1 }]}> 
        <KatanaBlade width={14} height={96} tint={'#F43F5E'} />
        <View style={styles.crossGuard}>
          <View style={[styles.crossH, { backgroundColor: '#b4a04a', shadowColor: '#b4a04a' }]} />
          <View style={[styles.crossV, { backgroundColor: '#b4a04a', shadowColor: '#b4a04a' }]} />
        </View>
        <View style={[styles.kGrip, { backgroundColor: '#1b2533' }]}>
          <View style={styles.kWrap} />
        </View>
      </Animated.View>
      <Text style={styles.label}>{label}…</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  sword: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  // Cross guard (replaces round tsuba)
  crossGuard: { width: 30, height: 16, marginTop: 6, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  crossH: { position: 'absolute', width: '100%', height: 6, backgroundColor: '#d4af37', borderRadius: 4, shadowColor: '#d4af37', shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  crossV: { position: 'absolute', width: 6, height: '100%', backgroundColor: '#d4af37', borderRadius: 4, shadowColor: '#d4af37', shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  kGrip: { width: 8, height: 30, backgroundColor: '#1f2937', borderRadius: 4, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  kWrap: { width: '70%', height: '75%', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3 },
  label: { marginTop: 130, color: COLORS.textSecondary, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});
