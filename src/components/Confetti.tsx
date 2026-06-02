import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withDelay, runOnJS,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

const COLORS = [
  colors.amber, colors.leafLight, colors.jungleLight,
  colors.cream, '#f5c842', colors.jungleBright, colors.leafPale,
];

interface PieceProps {
  x: number;
  color: string;
  delay: number;
  duration: number;
  onDone: () => void;
}

function Piece({ x, color, delay, duration, onDone }: PieceProps) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay * 1000, withTiming(0, { duration }));
    translateY.value = withDelay(delay * 1000, withTiming(180, { duration }, () => runOnJS(onDone)()));
    rotate.value = withDelay(delay * 1000, withTiming(720, { duration }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.piece, { left: `${x}%`, backgroundColor: color }, style]} />
  );
}

interface ConfettiProps {
  active: boolean;
}

export function Confetti({ active }: ConfettiProps) {
  const [pieces, setPieces] = React.useState<{ id: number; x: number; color: string; delay: number; duration: number }[]>([]);
  const counterRef = React.useRef(0);

  useEffect(() => {
    if (!active) return;
    const next = Array.from({ length: 35 }, (_, i) => ({
      id: counterRef.current++,
      x: 5 + Math.random() * 90,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.4,
      duration: 900 + Math.random() * 600,
    }));
    setPieces(prev => [...prev, ...next]);
  }, [active]);

  function removePiece(id: number) {
    setPieces(prev => prev.filter(p => p.id !== id));
  }

  return (
    <View style={styles.stage} pointerEvents="none">
      {pieces.map(p => (
        <Piece key={p.id} x={p.x} color={p.color} delay={p.delay} duration={p.duration} onDone={() => removePiece(p.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, overflow: 'hidden' },
  piece: { position: 'absolute', width: 9, height: 9, borderRadius: 2, top: 0 },
});
