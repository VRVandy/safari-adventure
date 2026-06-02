import React, { useRef, useState } from 'react';
import { Pressable, Text, StyleSheet, Linking, Platform } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Animal } from '@/types/animal';
import { colors } from '@/constants/theme';

interface Props {
  animal: Animal;
}

type SoundState = 'idle' | 'loading' | 'playing' | 'error';

// Web: use the browser's native Audio element
function useWebSound(url: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<SoundState>('idle');

  function toggle() {
    if (!url) return;

    // If errored, open search instead
    if (state === 'error') return;

    if (state === 'playing') {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setState('idle');
      return;
    }

    if (!audioRef.current) {
      const audio = new (window as any).Audio(url);
      audio.onended = () => setState('idle');
      audio.onerror = () => setState('error');
      audioRef.current = audio;
    }

    setState('loading');
    audioRef.current.play()
      .then(() => setState('playing'))
      .catch(() => setState('error'));
  }

  return { state, toggle };
}

export function SoundButton({ animal }: Props) {
  const desc = animal.soundDescription || 'animal sound';
  const hasDirectSound = !!(animal.wikiSoundUrl && /\.(ogg|mp3)$/i.test(animal.wikiSoundUrl));

  const webSound = useWebSound(Platform.OS === 'web' && hasDirectSound ? animal.wikiSoundUrl : null);
  const nativePlayer = useAudioPlayer(
    Platform.OS !== 'web' && hasDirectSound ? { uri: animal.wikiSoundUrl! } : null
  );

  // If web audio errored, treat as no direct sound and open search
  const canPlayDirectly = hasDirectSound && (Platform.OS !== 'web' || webSound.state !== 'error');

  function handlePress() {
    if (!canPlayDirectly) {
      Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(animal.name + ' animal sound')}&tbm=vid`);
      return;
    }
    if (Platform.OS === 'web') {
      webSound.toggle();
    } else {
      if (nativePlayer.playing) {
        nativePlayer.pause();
      } else {
        nativePlayer.seekTo(0);
        nativePlayer.play();
      }
    }
  }

  const isPlaying = Platform.OS === 'web' ? webSound.state === 'playing' : nativePlayer.playing;
  const isLoading = Platform.OS === 'web' && webSound.state === 'loading';

  let icon = '🔈';
  let actionLabel = canPlayDirectly ? '▶ Play' : '↗ Search';
  if (isLoading) { icon = '⏳'; actionLabel = 'Loading...'; }
  else if (isPlaying) { icon = '🔊'; actionLabel = '⏸ Pause'; }
  else if (!canPlayDirectly) { icon = '🔈'; actionLabel = '↗ Search'; }

  return (
    <Pressable style={styles.btn} onPress={handlePress}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>Hear the {desc}</Text>
      <Text style={styles.action}>{actionLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: colors.jungleMid,
    borderWidth: 1.5, borderColor: colors.jungleLight,
    borderRadius: 12, padding: 10, marginBottom: 14,
  },
  icon: { fontSize: 18 },
  label: { flex: 1, fontSize: 13, color: colors.leafPale },
  action: { fontSize: 13, color: colors.amber },
});
