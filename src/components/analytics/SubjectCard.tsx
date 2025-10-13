import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  subjectName: string;
  subtitle?: string;
  correct: number;
  incorrect: number;
};

const SIZE = 48; // total SVG size (includes stroke)
const STROKE = 6;
const R = (SIZE - STROKE) / 2; // circle radius leaves room for stroke
const C = 2 * Math.PI * R;

const SubjectCard: React.FC<Props> = ({ subjectName, subtitle, correct, incorrect }) => {
  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const dash = C * (1 - pct / 100);

  return (
    <View style={styles.row}>
      <View style={styles.content}>
        <Text style={styles.subject}>{subjectName}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.counts}>{correct} correct • {incorrect} wrong</Text>
      </View>

      <View style={styles.circleWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={COLORS.border}
            strokeWidth={STROKE}
            fill="transparent"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={COLORS.primary}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${C} ${C}`}
            strokeDashoffset={dash}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.circleLabel}><Text style={styles.pctText}>{pct}%</Text></View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  circleWrap: {
    width: SIZE,
    height: SIZE,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pctText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    flexShrink: 1,
  },
  subject: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  counts: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
});

export default SubjectCard;
