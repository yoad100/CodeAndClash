import React from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import Svg, { Defs, ClipPath, Rect, G, LinearGradient, Stop, Path, Circle, Ellipse } from 'react-native-svg';
import { COLORS } from '../../constants/colors';

type Props = {
  size?: number; // width of the SVG; height scales proportionally
  label?: string;
  durationMs?: number; // time for a full countdown (top -> empty)
  loop?: boolean; // if true, resets and repeats countdown
  showCountdown?: boolean; // show mm:ss or ss left for current cycle
};

export const Hourglass: React.FC<Props> = ({ size = 120, label, durationMs = 10000, loop = true, showCountdown = true }) => {
  const progress = React.useRef(new Animated.Value(0)).current; // 0 -> 1 sand transfer
  const wobble = React.useRef(new Animated.Value(0)).current;   // slight tilt
  const shimmer = React.useRef(new Animated.Value(0)).current;  // glass glint
  const [remainingMs, setRemainingMs] = React.useState(durationMs);

  React.useEffect(() => {
    // Drive sand transfer from full to empty according to durationMs
    const sequence = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: durationMs, easing: Easing.linear, useNativeDriver: false }),
      Animated.timing(progress, { toValue: 0, duration: 1, useNativeDriver: false }), // instant reset
      Animated.delay(400),
    ]);
    const cycle = loop ? Animated.loop(sequence) : sequence;
    const tilt = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const shine = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 400, easing: Easing.linear, useNativeDriver: false }),
        Animated.delay(800),
      ])
    );
    cycle.start();
    tilt.start();
    shine.start();
    // Sync numeric countdown with progress
    const sub = progress.addListener(({ value }) => {
      const rem = Math.max(0, Math.round((1 - (value % 1)) * durationMs));
      setRemainingMs(rem);
    });
    return () => { cycle.stop(); tilt.stop(); shine.stop(); progress.removeListener(sub); };
  }, [durationMs, loop]);

  const W = size;
  const H = Math.round(size * 1.6);
  const P = Math.max(6, Math.round(size * 0.08)); // outer padding
  const CX = W / 2;
  const CY = H / 2;
  const frameT = Math.max(6, Math.round(W * 0.08)); // wooden frame thickness
  const capH = Math.max(10, Math.round(H * 0.08)); // top/bottom cap height
  const neckHalf = Math.max(4, Math.round(W * 0.06)); // half width of glass neck
  const neckH = Math.max(6, Math.round(H * 0.02)); // neck vertical span
  const innerL = P + frameT; // inner left bound of glass
  const innerR = W - (P + frameT);
  const topY = P + capH;
  const botY = H - (P + capH);
  const yNeckTop = CY - neckH / 2;
  const yNeckBot = CY + neckH / 2;
  const bulbHalf = (innerR - innerL) / 2; // half width at the widest part
  const rimInset = Math.max(2, Math.round(W * 0.02));
  const topHeight = yNeckTop - topY;
  const bottomHeight = botY - yNeckBot;

  // Animated sand levels
  const topSandH = progress.interpolate({ inputRange: [0, 1], outputRange: [topHeight, 0] });
  const bottomSandH = progress.interpolate({ inputRange: [0, 1], outputRange: [0, bottomHeight] });
  const bottomSandY = progress.interpolate({ inputRange: [0, 1], outputRange: [botY, yNeckBot] });
  const streamOpacity = progress.interpolate({ inputRange: [0, 0.02, 0.98, 1], outputRange: [0, 1, 1, 0] });

  // Slight tilt wobble
  const tiltDeg = wobble.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-2deg', '0deg', '2deg'] });

  // Glass shimmer
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-W * 0.3, W * 0.3] });

  // Animated wrappers
  const ARect = React.useMemo(() => Animated.createAnimatedComponent(Rect), []);
  const AEllipse = React.useMemo(() => Animated.createAnimatedComponent(Ellipse), []);
  const AG = React.useMemo(() => Animated.createAnimatedComponent(G as any), []);

  // Build curved bulb paths (top and bottom)
  const leftX = innerL + rimInset;
  const rightX = innerR - rimInset;
  const topPath = `M ${CX - bulbHalf} ${topY}
    C ${CX - bulbHalf * 0.85} ${topY}, ${CX - neckHalf * 1.7} ${yNeckTop - topHeight * 0.25}, ${CX - neckHalf} ${yNeckTop}
    L ${CX + neckHalf} ${yNeckTop}
    C ${CX + neckHalf * 1.7} ${yNeckTop - topHeight * 0.25}, ${CX + bulbHalf * 0.85} ${topY}, ${CX + bulbHalf} ${topY}
    Z`;
  const bottomPath = `M ${CX - bulbHalf} ${botY}
    C ${CX - bulbHalf * 0.85} ${botY}, ${CX - neckHalf * 1.7} ${yNeckBot + bottomHeight * 0.25}, ${CX - neckHalf} ${yNeckBot}
    L ${CX + neckHalf} ${yNeckBot}
    C ${CX + neckHalf * 1.7} ${yNeckBot + bottomHeight * 0.25}, ${CX + bulbHalf * 0.85} ${botY}, ${CX + bulbHalf} ${botY}
    Z`;

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ rotate: tiltDeg }] }}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}> 
          <Defs>
            {/* Bulb clip paths (curved) */}
            <ClipPath id="clipTop">
              <Path d={topPath} />
            </ClipPath>
            <ClipPath id="clipBottom">
              <Path d={bottomPath} />
            </ClipPath>
            {/* Sand gradient (sensory color) */}
            <LinearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#22D3EE" stopOpacity={0.95} />
              <Stop offset="1" stopColor="#06B6D4" stopOpacity={0.95} />
            </LinearGradient>
            {/* Glass gradient */}
            <LinearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#8ecae6" stopOpacity={0.12} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0.08} />
            </LinearGradient>
            {/* Cap gradient (plastic) */}
            <LinearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#7C3AED" />
              <Stop offset="1" stopColor="#5B21B6" />
            </LinearGradient>
          </Defs>

          {/* Plastic frame: top/bottom caps and side pillars */}
          <Rect x={P} y={P} width={W - P * 2} height={capH} rx={capH / 2} fill="url(#cap)" />
          <Rect x={P} y={H - P - capH} width={W - P * 2} height={capH} rx={capH / 2} fill="url(#cap)" />
          {/* pillars */}
          <Rect x={P} y={P + capH} width={frameT} height={H - (P * 2 + capH * 2)} rx={frameT / 2} fill="url(#cap)" opacity={0.95} />
          <Rect x={W - P - frameT} y={P + capH} width={frameT} height={H - (P * 2 + capH * 2)} rx={frameT / 2} fill="url(#cap)" opacity={0.95} />
          {/* cap highlights */}
          <Rect x={P + 8} y={P + 3} width={W - P * 2 - 16} height={capH * 0.35} rx={capH * 0.2} fill="#FFFFFF" opacity={0.12} />
          <Rect x={P + 8} y={H - P - capH + 3} width={W - P * 2 - 16} height={capH * 0.35} rx={capH * 0.2} fill="#FFFFFF" opacity={0.12} />

          {/* Glass bulbs */}
          <Path d={topPath} fill="url(#glass)" stroke={COLORS.secondary} strokeOpacity={0.4} strokeWidth={1.2} />
          <Path d={bottomPath} fill="url(#glass)" stroke={COLORS.secondary} strokeOpacity={0.4} strokeWidth={1.2} />

          {/* Neck highlight */}
          <Rect x={CX - neckHalf} y={CY - 1} width={neckHalf * 2} height={2} fill="#ffffff" opacity={0.18} rx={1} />

          {/* Upper sand (decreasing) */}
          <G clipPath="url(#clipTop)">
            {/* fill block */}
            <ARect x={innerL} y={Animated.subtract(yNeckTop, topSandH as any) as any} width={innerR - innerL} height={topSandH as any} fill="url(#sand)" />
            {/* curved surface (rx shrinks with progress) */}
            <AEllipse
              cx={CX as any}
              cy={Animated.subtract(yNeckTop, topSandH as any) as any}
              rx={Animated.add(bulbHalf * 0.35, Animated.multiply(Animated.add(1, Animated.multiply(progress, -1)), bulbHalf * 0.55) as any) as any}
              ry={Math.max(3, H * 0.02)}
              fill={'#0ea5b7'}
              opacity={0.35}
            />
          </G>
          {/* Lower sand (increasing) */}
          <G clipPath="url(#clipBottom)">
            {/* fill block */}
            <ARect x={innerL} y={bottomSandY as any} width={innerR - innerL} height={bottomSandH as any} fill="url(#sand)" />
            {/* mound ellipse (rx grows with progress) */}
            <AEllipse
              cx={CX as any}
              cy={Animated.add(yNeckBot, Animated.multiply(progress, bottomHeight * 0.55) as any) as any}
              rx={Animated.add(bulbHalf * 0.25, Animated.multiply(progress, bulbHalf * 0.5) as any) as any}
              ry={Math.max(3, H * 0.026)}
              fill={'#22D3EE'}
              opacity={0.55}
            />
          </G>

          {/* Glass outline on top of sand for crisp silhouette */}
          <Path d={topPath} fill="none" stroke={COLORS.secondary} strokeOpacity={0.45} strokeWidth={1.2} />
          <Path d={bottomPath} fill="none" stroke={COLORS.secondary} strokeOpacity={0.45} strokeWidth={1.2} />

          {/* Falling stream */}
          <AG style={{ opacity: streamOpacity as any }}>
            <Path d={`M ${CX - 0.8} ${yNeckTop - topHeight * 0.55} L ${CX + 0.8} ${yNeckTop - topHeight * 0.55} L ${CX + 0.6} ${yNeckBot} L ${CX - 0.6} ${yNeckBot} Z`} fill={'#22D3EE'} opacity={0.95} />
            {/* grains */}
            <Circle cx={CX} cy={CY + 4} r={1.1} fill={'#22D3EE'} opacity={0.95} />
            <Circle cx={CX} cy={CY + 10} r={1} fill={'#22D3EE'} opacity={0.9} />
            <Circle cx={CX} cy={CY + 16} r={0.9} fill={'#06B6D4'} opacity={0.9} />
          </AG>

          {/* Glass edge highlights */}
          <Path d={`M ${CX - bulbHalf * 0.95} ${topY + 4} C ${CX - bulbHalf * 0.8} ${topY + 10}, ${CX - bulbHalf * 0.7} ${yNeckTop - 10}, ${CX - neckHalf * 0.9} ${yNeckTop - 2}`} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={1.2} />
          <Path d={`M ${CX + neckHalf * 0.9} ${yNeckBot + 2} C ${CX + bulbHalf * 0.7} ${yNeckBot + 10}, ${CX + bulbHalf * 0.8} ${botY - 10}, ${CX + bulbHalf * 0.95} ${botY - 4}`} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={1.2} />

          {/* Shimmer sweep */}
          <Rect x={shimmerX as any} y={topY} width={W * 0.2} height={botY - topY} fill="#ffffff" opacity={0.06} transform={`rotate(12 ${CX} ${CY})`} />
        </Svg>
      </Animated.View>
      {label ? <Text style={styles.label}>{label}…</Text> : null}
      {showCountdown ? (
        <Text style={styles.countdown}>
          {remainingMs >= 60000
            ? `${String(Math.floor(remainingMs / 60000)).padStart(2, '0')}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')}`
            : `${Math.ceil(remainingMs / 1000)}s`}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  label: { marginTop: 12, color: COLORS.textSecondary, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  countdown: { marginTop: 6, color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
});

export default Hourglass;
