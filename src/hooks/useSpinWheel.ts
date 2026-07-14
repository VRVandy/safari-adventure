import { useRef, useState, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { WHEEL_EMOJIS } from '@/constants/theme';

function pickEmojis(): string[] {
  const pool = [...WHEEL_EMOJIS];
  return Array.from({ length: 10 }, () => {
    const i = Math.floor(Math.random() * pool.length);
    return pool.splice(i, 1)[0];
  });
}

export function useSpinWheel(onSpinEnd: () => void) {
  const rotationDeg = useRef(new Animated.Value(0)).current;
  const currentDeg = useRef(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayEmojis, setDisplayEmojis] = useState(() => WHEEL_EMOJIS.slice(0, 10));
  const shuffleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;

  const spin = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);

    shuffleTimer.current = setInterval(() => {
      setDisplayEmojis(pickEmojis());
    }, 120);

    const spins = 4 + Math.random() * 2;
    const target = currentDeg.current - spins * 360;
    currentDeg.current = target;

    Animated.timing(rotationDeg, {
      toValue: target,
      duration: 3600,
      easing: Easing.out(Easing.poly(4)),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      if (shuffleTimer.current) clearInterval(shuffleTimer.current);
      setIsSpinning(false);
      onSpinEndRef.current();
    });
  }, [isSpinning, rotationDeg]);

  const rotation = rotationDeg.interpolate({
    inputRange: [-360000, 360000],
    outputRange: ['-360000deg', '360000deg'],
  });

  return { rotation, isSpinning, displayEmojis, spin };
}
