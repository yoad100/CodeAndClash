import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  height?: number;
  width?: number;
  tint?: string; // base blade color
};

const RED_TINTS = ['f43f5e', 'c62828', 'ff4d67'];

const chooseAccent = (tint: string | undefined, fallback: string): string => {
  if (!tint) return fallback;
  const normalized = tint.replace('#', '').toLowerCase();
  return RED_TINTS.some((code) => normalized.includes(code)) ? '#ffd1d8' : fallback;
};

export const KatanaBlade: React.FC<Props> = ({ height = 100, width = 14, tint = '#ffffff' }) => {
  const bladeColor = tint || '#ffffff';
  const edgeColor = chooseAccent(tint, '#f3f7ff');
  const ridgeColor = chooseAccent(tint, 'rgba(255,255,255,0.22)');
  const hamonColor = chooseAccent(tint, 'rgba(236,247,255,0.4)');
  const spineColor = tint ? '#d1d5db' : '#a5b4fc';
  const fullerColor = tint ? 'rgba(0,0,0,0.08)' : 'rgba(14,17,28,0.14)';
  const specularColor = tint ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.35)';

  const bodyStyle = React.useMemo(
    () => ({
      height,
      width,
      borderTopRightRadius: width * 1.15,
      borderBottomRightRadius: width * 0.6,
      borderBottomLeftRadius: width * 0.35,
      backgroundColor: bladeColor,
    }),
    [height, width, bladeColor]
  );

  const edgeStyle = React.useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      bottom: 0,
      width: width * 0.32,
      right: -width * 0.04,
      borderTopRightRadius: width,
      borderBottomRightRadius: width * 0.6,
      backgroundColor: edgeColor,
    }),
    [width, edgeColor]
  );

  const ridgeStyle = React.useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      bottom: 0,
      width: width * 0.18,
      left: width * 0.12,
      borderTopLeftRadius: width,
      borderBottomLeftRadius: width * 0.4,
      backgroundColor: ridgeColor,
    }),
    [width, ridgeColor]
  );

  const hamonStyle = React.useMemo(
    () => ({
      position: 'absolute' as const,
      bottom: height * 0.08,
      height: height * 0.62,
      width: width * 0.42,
      right: -width * 0.05,
      borderTopLeftRadius: width * 0.9,
      borderBottomLeftRadius: width * 1.6,
      borderTopRightRadius: width * 1.2,
      borderBottomRightRadius: width * 0.6,
      backgroundColor: hamonColor,
    }),
    [width, height, hamonColor]
  );

  const tipStyle = React.useMemo(
    () => ({
      width: width * 0.7,
      height: height * 0.22,
      borderTopRightRadius: width * 0.9,
      borderBottomRightRadius: width * 0.5,
      right: -width * 0.2,
      backgroundColor: edgeColor,
    }),
    [width, height, edgeColor]
  );

  return (
    <View style={[styles.wrapper, { height, width: width * 1.18 }]}> 
      <LinearGradient
        colors={[spineColor, bladeColor, bladeColor]}
        start={{ x: 0.05, y: 0.1 }}
        end={{ x: 0.95, y: 0.9 }}
        style={[styles.bladeBody, bodyStyle]}
      >
        <View style={edgeStyle} />
        <View style={ridgeStyle} />
        <View style={[styles.fuller, { backgroundColor: fullerColor, width: width * 0.28, left: width * 0.26 }]} />
        <View style={[styles.specular, { backgroundColor: specularColor }]} />
        <View style={[styles.hamon, hamonStyle]} />
        <View style={[styles.tip, tipStyle]} />
      </LinearGradient>
      <View style={[styles.shadow, { height, width: width * 0.4 }]} />
    </View>
  );
};

export default KatanaBlade;

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  bladeBody: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 10,
    transform: [{ skewY: '-4deg' }],
    overflow: 'hidden',
    position: 'relative',
  },
  hamon: {
    opacity: 0.35,
  },
  tip: {
    position: 'absolute',
    top: -3,
    transform: [{ rotate: '6deg' }],
    opacity: 0.9,
  },
  fuller: {
    position: 'absolute',
    top: '10%',
    bottom: '18%',
    borderRadius: 100,
    opacity: 0.32,
  },
  specular: {
    position: 'absolute',
    top: '6%',
    bottom: '40%',
    right: '12%',
    width: '16%',
    borderRadius: 999,
    opacity: 0.4,
    transform: [{ skewY: '-6deg' }],
  },
  shadow: {
    position: 'absolute',
    right: -6,
    borderBottomLeftRadius: 120,
    borderTopLeftRadius: 120,
    backgroundColor: 'rgba(0,0,0,0.25)',
    opacity: 0.25,
    transform: [{ skewY: '-4deg' }, { translateX: 3 }],
  },
});
