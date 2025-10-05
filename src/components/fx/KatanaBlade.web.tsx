import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  height?: number;
  width?: number;
  tint?: string;
};

// Web fallback: approximate a curved katana blade with stacked segments and overlays (no react-native-svg)
const KatanaBlade: React.FC<Props> = ({ height = 100, width = 14, tint = '#ffffff' }) => {
  const segH = Math.max(20, Math.floor(height / 3));
  const curve = Math.max(4, Math.floor(width * 0.35));
  const isRed = /#|rgb|hsl/.test(tint) ? (tint.toLowerCase().includes('f43f5e') || tint.toLowerCase().includes('c62828') || tint.toLowerCase().includes('ff')) : false;

  return (
    <View style={[styles.wrap, { width, height }]}
      pointerEvents="none">
      {/* bottom segment */}
      <View style={[styles.seg, { backgroundColor: tint, width, height: segH, bottom: 0, shadowColor: isRed ? '#ff6b6b' : '#9fd1ff', shadowOpacity: 0.3, shadowRadius: 3 }]} />
      {/* middle segment */}
      <View style={[styles.seg, { backgroundColor: tint, width, height: segH, bottom: segH, transform: [{ translateX: curve * 0.4 }], opacity: 0.96 }]} />
      {/* top segment */}
      <View style={[styles.seg, { backgroundColor: tint, width, height: height - segH * 2, bottom: segH * 2, transform: [{ translateX: curve * 0.8 }], opacity: 0.92 }]} />

      {/* edge line */}
      <View style={[styles.edge, { right: 0, height, backgroundColor: isRed ? '#ffd6da' : '#f0f7ff' }]} />
      {/* yokote near tip */}
      <View style={[styles.yokote, { top: Math.max(8, height * 0.16), width, backgroundColor: isRed ? 'rgba(255,194,202,0.8)' : 'rgba(210,225,255,0.65)' }]} />
      {/* subtle hamon impression */}
      <View style={[styles.hamon, { right: 2, height, backgroundColor: isRed ? 'rgba(255,209,214,0.45)' : 'rgba(230,240,255,0.35)' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'relative', overflow: 'visible' },
  seg: { position: 'absolute', borderRadius: 6 },
  edge: { position: 'absolute', width: 2, backgroundColor: '#f0f7ff', opacity: 0.6 },
  yokote: { position: 'absolute', height: 1, backgroundColor: 'rgba(210,225,255,0.65)' },
  hamon: { position: 'absolute', width: 1, backgroundColor: 'rgba(230,240,255,0.35)', opacity: 0.4 },
});

export default KatanaBlade;
