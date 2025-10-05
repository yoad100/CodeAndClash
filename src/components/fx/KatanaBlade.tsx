import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

type Props = {
  height?: number;
  width?: number;
  tint?: string; // base blade color
};

// Curved katana blade with subtle hamon (temper line) and yokote
export const KatanaBlade: React.FC<Props> = ({ height = 100, width = 14, tint = '#ffffff' }) => {
  const w = width;
  const h = height;
  const id = React.useId();
  // Realistic silhouette: curved mune (spine) and ha (edge), with a proper kissaki
  // Start at tang end (left-bottom), curve to tip (right-top), return along spine
  const edgePath = `M 1 ${h - 1} C ${w * 0.25} ${h * 0.62}, ${w * 0.62} ${h * 0.22}, ${w - 1.2} 2`;
  const spinePath = `C ${w * 0.58} ${h * 0.28}, ${w * 0.22} ${h * 0.68}, 1 ${h - 1} Z`;
  const bladePath = `${edgePath} L ${w - 2} 2 ${spinePath}`;
  // Wavy hamon along edge (simple bezier zig)
  const hamonPath = `M ${w - 5} ${h * 0.08} C ${w - 8} ${h * 0.16}, ${w - 9} ${h * 0.26}, ${w - 6.5} ${h * 0.34} 
                     C ${w - 9.5} ${h * 0.42}, ${w - 10} ${h * 0.52}, ${w - 7} ${h * 0.6} 
                     C ${w - 10} ${h * 0.7}, ${w - 10} ${h * 0.8}, ${w - 8} ${h * 0.88}`;
  // Yokote line separating the kissaki
  const yokoteX = w - 7.5;
  const yokotePath = `M ${yokoteX} ${h * 0.28} L ${yokoteX} ${h * 0.02}`;

  // Metallic gradient varies with tint: for red, deepen the far side
  const isRed = /#|rgb|hsl/.test(tint) ? (tint.toLowerCase().includes('f43f5e') || tint.toLowerCase().includes('c62828') || tint.toLowerCase().includes('ff')) : false;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id={`bladeGrad-${id}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={tint} stopOpacity={isRed ? 0.95 : 0.98} />
          <Stop offset="1" stopColor={isRed ? '#b91523' : '#dfe7f5'} stopOpacity={0.88} />
        </LinearGradient>
        <RadialGradient id={`tipHighlight-${id}`} cx="85%" cy="10%" r="45%">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* Blade body with metallic gradient */}
      <Path d={bladePath} fill={`url(#bladeGrad-${id})`} />
      {/* Edge highlight along the ha */}
      <Path d={edgePath} fill="none" stroke={isRed ? '#ffd6da' : '#f0f7ff'} strokeWidth={1.2} opacity={0.6} />
      {/* Shinogi-ji (subtle ridge highlight at ~mid) */}
      <Path d={`M ${w * 0.45} ${h * 0.26} C ${w * 0.35} ${h * 0.36}, ${w * 0.28} ${h * 0.52}, ${w * 0.2} ${h * 0.64}`} stroke={isRed ? 'rgba(255,230,230,0.35)' : 'rgba(255,255,255,0.35)'} strokeWidth={0.8} />
      {/* Hamon (temper pattern) */}
      <Path d={hamonPath} stroke={isRed ? '#ffd1d6' : '#eaf3ff'} strokeWidth={0.9} opacity={0.55} fill="none" />
      {/* Yokote line near tip */}
      <Path d={yokotePath} stroke={isRed ? '#ffc2ca' : '#d8e9ff'} strokeWidth={1} opacity={0.7} />
      {/* Tip specular */}
      <Path d={bladePath} fill={`url(#tipHighlight-${id})`} />
    </Svg>
  );
};

export default KatanaBlade;
