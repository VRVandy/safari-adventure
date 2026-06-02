import { useRef, useState, useCallback } from 'react';
import {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { WHEEL_EMOJIS } from '@/constants/theme';

function pickEmojis(): string[] {
  const pool = [...WHEEL_EMOJIS];
  return Array.from({ length: 10 }, () => {
    const i = Math.floor(Math.random() * pool.length);
    return pool.splice(i, 1)[0];
  });
}

export function useSpinWheel(onSpinEnd: () => void) {
  const rotation = useSharedValue(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayEmojis, setDisplayEmojis] = useState(() => WHEEL_EMOJIS.slice(0, 10));
  const shuffleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const spin = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);

    // Shuffle emojis visually while spinning
    shuffleTimer.current = setInterval(() => {
      setDisplayEmojis(pickEmojis());
    }, 120);

    const spins = 4 + Math.random() * 2;
    const target = rotation.value - spins * 360;

    rotation.value = withTiming(target, {
      duration: 3600,
      easing: Easing.out(Easing.poly(4)),
    }, (finished) => {
      if (finished) {
        runOnJS(cleanup)();
      }
    });

    function cleanup() {
      if (shuffleTimer.current) clearInterval(shuffleTimer.current);
      setIsSpinning(false);
      onSpinEnd();
    }
  }, [isSpinning, rotation, onSpinEnd]);

  return { rotation, isSpinning, displayEmojis, spin };
}
