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

export const HourglassBeautiful: React.FC<Props> = ({ 
  size = 120, 
  label = "Finding Opponent", 
  durationMs = 10000, 
  loop = true, 
  showCountdown = true 
}) => {
  const progress = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const [remainingMs, setRemainingMs] = React.useState(durationMs);

  const W = size;
  const H = Math.round(size * 1.6);
  const P = Math.max(6, Math.round(size * 0.08));
  const CX = W / 2;
  const CY = H / 2;
  const frameT = Math.max(6, Math.round(W * 0.08));
  const capH = Math.max(10, Math.round(H * 0.08));
  const neckHalf = Math.max(4, Math.round(W * 0.06));
  const neckH = Math.max(6, Math.round(H * 0.02));
  const innerL = P + frameT;
  const innerR = W - (P + frameT);
  const topY = P + capH;
  const botY = H - (P + capH);
  const yNeckTop = CY - neckH / 2;
  const yNeckBot = CY + neckH / 2;
  const bulbWidth = innerR - innerL;
  const topHeight = yNeckTop - topY;
  const bottomHeight = botY - yNeckBot;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: durationMs, easing: Easing.linear, useNativeDriver: false }),
      Animated.timing(progress, { toValue: 0, duration: 1, useNativeDriver: false }),
      Animated.delay(400),
    ]);
    const cycle = loop ? Animated.loop(sequence) : sequence;
    
    const tilt = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    
    cycle.start();
    tilt.start();

    const sub = progress.addListener(({ value }) => {
      const rem = Math.max(0, Math.round((1 - (value % 1)) * durationMs));
      setRemainingMs(rem);
    });

    return () => { 
      cycle.stop(); 
      tilt.stop(); 
      progress.removeListener(sub); 
    };
  }, [durationMs, loop]);

  const topSandH = progress.interpolate({ inputRange: [0, 1], outputRange: [topHeight, 0] });
  const bottomSandH = progress.interpolate({ inputRange: [0, 1], outputRange: [0, bottomHeight] });
  const streamOpacity = progress.interpolate({ inputRange: [0, 0.02, 0.98, 1], outputRange: [0, 1, 1, 0] });
  const tiltDeg = wobble.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] });

  return (
    <View style={styles.wrap}>
      
      <Animated.View style={{ transform: [{ rotate: tiltDeg }] }}>
        <View style={{ width: W, height: H }}>
          {/* Top cap with gradient effect */}
          <View style={[styles.cap, { 
            left: P, top: P, 
            width: W - P * 2, 
            height: capH,
            borderRadius: capH / 2 
          }]}>
            <View style={[styles.capHighlight, { 
              top: 3,
              left: 8,
              right: 8,
              height: capH * 0.35, 
              borderRadius: capH * 0.2 
            }]} />
          </View>

          {/* Bottom cap */}
          <View style={[styles.cap, { 
            left: P, 
            top: H - P - capH, 
            width: W - P * 2, 
            height: capH,
            borderRadius: capH / 2 
          }]}>
            <View style={[styles.capHighlight, { 
              top: 3,
              left: 8,
              right: 8,
              height: capH * 0.35, 
              borderRadius: capH * 0.2 
            }]} />
          </View>

          {/* Left pillar */}
          <View style={[styles.pillar, { 
            left: P, 
            top: P + capH, 
            width: frameT, 
            height: H - (P * 2 + capH * 2),
            borderRadius: frameT / 2 
          }]} />

          {/* Right pillar */}
          <View style={[styles.pillar, { 
            left: W - P - frameT, 
            top: P + capH, 
            width: frameT, 
            height: H - (P * 2 + capH * 2),
            borderRadius: frameT / 2 
          }]} />

          {/* Top bulb glass container */}
          <View style={[styles.bulb, { 
            left: innerL, 
            top: topY, 
            width: bulbWidth, 
            height: topHeight,
            borderTopLeftRadius: bulbWidth * 0.5,
            borderTopRightRadius: bulbWidth * 0.5,
            borderBottomLeftRadius: neckHalf * 1.5,
            borderBottomRightRadius: neckHalf * 1.5,
          }]}>
            {/* Top sand with realistic gradient and curve */}
            <Animated.View style={[styles.sandContainer, { 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: topSandH,
              borderBottomLeftRadius: neckHalf * 1.5,
              borderBottomRightRadius: neckHalf * 1.5,
            }]}>
              <View style={styles.sandGradient} />
              {/* Sand surface curve */}
              <View style={[styles.sandSurface, {
                top: -4,
                left: bulbWidth * 0.15,
                right: bulbWidth * 0.15,
                height: 8,
              }]} />
            </Animated.View>
            
            {/* Inner glass shine - left side */}
            <View style={[styles.glassShine, {
              left: 3,
              top: 6,
              width: 3,
              height: topHeight * 0.5,
              borderRadius: 1.5,
            }]} />
            
            {/* Inner glass shine - right side (subtle) */}
            <View style={[styles.glassShine, {
              right: 3,
              top: topHeight * 0.2,
              width: 2,
              height: topHeight * 0.3,
              borderRadius: 1,
              opacity: 0.5,
            }]} />
          </View>

          {/* Neck with better glass effect */}
          <View style={[styles.neck, { 
            left: CX - neckHalf, 
            top: yNeckTop, 
            width: neckHalf * 2, 
            height: neckH 
          }]}>
            <View style={[styles.neckHighlight, {
              top: neckH / 2 - 1,
              left: 2,
              right: 2,
              height: 2,
            }]} />
          </View>

          {/* Bottom bulb glass container */}
          <View style={[styles.bulb, { 
            left: innerL, 
            top: yNeckBot, 
            width: bulbWidth, 
            height: bottomHeight,
            borderTopLeftRadius: neckHalf * 1.5,
            borderTopRightRadius: neckHalf * 1.5,
            borderBottomLeftRadius: bulbWidth * 0.5,
            borderBottomRightRadius: bulbWidth * 0.5,
          }]}>
            {/* Bottom sand with realistic pile effect */}
            <Animated.View style={[styles.sandContainer, { 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: bottomSandH,
              borderBottomLeftRadius: bulbWidth * 0.5,
              borderBottomRightRadius: bulbWidth * 0.5,
            }]}>
              <View style={styles.sandGradient} />
              {/* Sand mound on top */}
              <Animated.View style={[styles.sandMound, {
                top: -3,
                left: bulbWidth * 0.25,
                right: bulbWidth * 0.25,
                height: 6,
                opacity: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.8, 1] })
              }]} />
            </Animated.View>
            
            {/* Inner glass shine - left side */}
            <View style={[styles.glassShine, {
              left: 3,
              bottom: bottomHeight * 0.2,
              width: 2,
              height: bottomHeight * 0.3,
              borderRadius: 1,
              opacity: 0.5,
            }]} />
            
            {/* Inner glass shine - right side */}
            <View style={[styles.glassShine, {
              right: 3,
              bottom: 6,
              width: 3,
              height: bottomHeight * 0.5,
              borderRadius: 1.5,
            }]} />
          </View>

          {/* Falling sand stream with particles */}
          <Animated.View style={[styles.stream, { 
            left: CX - 1.5, 
            top: yNeckTop, 
            width: 3,
            height: neckH,
            opacity: streamOpacity 
          }]}>
            {/* Animated falling grains */}
            <View style={[styles.grain, { top: neckH * 0.15, left: 0.5 }]} />
            <View style={[styles.grain, { top: neckH * 0.4, left: 1 }]} />
            <View style={[styles.grain, { top: neckH * 0.65, left: 0.2 }]} />
            <View style={[styles.grain, { top: neckH * 0.85, left: 0.8 }]} />
          </Animated.View>
        </View>
      </Animated.View>

      {label && <Text style={styles.label}>{label}…</Text>}
      {showCountdown && (
        <Text style={styles.countdown}>
          {remainingMs >= 60000
            ? `${String(Math.floor(remainingMs / 60000)).padStart(2, '0')}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')}`
            : `${Math.ceil(remainingMs / 1000)}s`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  cap: {
    position: 'absolute',
    backgroundColor: '#0891B2',
    shadowColor: '#0E7490',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },
  capHighlight: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.2,
  },
  pillar: {
    position: 'absolute',
    backgroundColor: '#0891B2',
    opacity: 0.95,
    shadowColor: '#0E7490',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 3,
  },
  bulb: {
    position: 'absolute',
    backgroundColor: 'rgba(142, 202, 230, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    overflow: 'hidden',
  },
  sandContainer: {
    overflow: 'hidden',
  },
  sandGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#22D3EE',
  },
  sandSurface: {
    position: 'absolute',
    backgroundColor: '#0EA5B7',
    borderRadius: 100,
    opacity: 0.6,
  },
  sandMound: {
    position: 'absolute',
    backgroundColor: '#14B8A6',
    borderRadius: 100,
  },
  neck: {
    position: 'absolute',
    backgroundColor: 'rgba(142, 202, 230, 0.12)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  neckHighlight: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.18,
    borderRadius: 1,
  },
  glassShine: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  stream: {
    position: 'absolute',
    backgroundColor: '#22D3EE',
  },
  grain: {
    position: 'absolute',
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: '#06B6D4',
    opacity: 0.9,
  },
  label: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  countdown: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default HourglassBeautiful;
