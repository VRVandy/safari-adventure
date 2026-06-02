import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { colors, sectorColors } from '@/constants/theme';

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 136;
const N = 10;
const SLICE = (2 * Math.PI) / N;

function sectorPath(index: number): string {
  const start = index * SLICE - Math.PI / 2;
  const end = start + SLICE;
  const x1 = CX + R * Math.cos(start);
  const y1 = CY + R * Math.sin(start);
  const x2 = CX + R * Math.cos(end);
  const y2 = CY + R * Math.sin(end);
  return `M${CX},${CY} L${x1},${y1} A${R},${R} 0 0,1 ${x2},${y2} Z`;
}

function emojiPosition(index: number) {
  const mid = index * SLICE - Math.PI / 2 + SLICE / 2;
  return { x: CX + 90 * Math.cos(mid), y: CY + 90 * Math.sin(mid) };
}

interface Props {
  rotation: SharedValue<number>;
  emojis: string[];
  centerEmoji: string;
  onSpin: () => void;
  disabled: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function SpinWheel({ rotation, emojis, centerEmoji, onSpin, disabled }: Props) {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value % 360}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Pointer */}
      <View style={styles.pointer} />

      <AnimatedView style={[styles.wheelWrap, style]}>
        <Svg width={SIZE} height={SIZE}>
          {Array.from({ length: N }, (_, i) => (
            <React.Fragment key={i}>
              <Path
                d={sectorPath(i)}
                fill={sectorColors[i]}
                stroke={colors.jungleDarkest}
                strokeWidth={2.5}
              />
              <SvgText
                x={emojiPosition(i).x}
                y={emojiPosition(i).y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={24}
              >
                {emojis[i]}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </AnimatedView>

      {/* Center emoji overlay (not rotated) */}
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.centerText}>{centerEmoji}</Text>
      </View>

      <Pressable
        style={[styles.spinBtn, disabled && styles.spinBtnDisabled]}
        onPress={onSpin}
        disabled={disabled}
      >
        <Text style={styles.spinBtnText}>Spin the wheel!</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 20 },
  wheelWrap: { width: SIZE, height: SIZE },
  pointer: {
    width: 0, height: 0,
    borderLeftWidth: 13, borderRightWidth: 13, borderTopWidth: 28,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: colors.amber,
    zIndex: 3,
    marginBottom: -14,
  },
  center: {
    position: 'absolute',
    top: 28 + SIZE / 2 - 32,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.jungleDarkest,
    borderWidth: 3, borderColor: colors.jungleLight,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  centerText: { fontSize: 30 },
  spinBtn: {
    backgroundColor: colors.amber,
    borderRadius: 50,
    paddingVertical: 16, paddingHorizontal: 52,
  },
  spinBtnDisabled: { opacity: 0.45 },
  spinBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18, fontWeight: '700',
    color: colors.bark,
  },
});
