import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpinWheel } from '@/components/SpinWheel';
import { AnimalCard } from '@/components/AnimalCard';
import { AnimalPreview } from '@/components/AnimalPreview';
import { Confetti } from '@/components/Confetti';
import { useSpinWheel } from '@/hooks/useSpinWheel';
import { useAnimalData } from '@/hooks/useAnimalData';
import { colors } from '@/constants/theme';
import { Animal } from '@/types/animal';

export default function HomeScreen() {
  const [confetti, setConfetti] = useState(false);
  const [centerEmoji, setCenterEmoji] = useState('?');
  const [showWheel, setShowWheel] = useState(true);
  const fetchPromiseRef = useRef<Promise<Animal | null> | null>(null);

  const { phase, spinCount, pickedAnimals, startFetch, commitSpin, confirmAnimals, rejectLastSpin, reset } = useAnimalData();

  function handleSpinEnd() {
    // Clear the ref immediately — prevents double-fire on Android
    const promise = fetchPromiseRef.current;
    fetchPromiseRef.current = null;
    promise?.then(animal => {
      if (!animal) return;
      setCenterEmoji(animal.emoji);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 200);
      commitSpin(animal);
      setShowWheel(false);
    });
  }

  const { rotation, isSpinning, displayEmojis, spin } = useSpinWheel(handleSpinEnd);

  function handleSpin() {
    setCenterEmoji('?');
    setShowWheel(true);
    fetchPromiseRef.current = startFetch();
    spin();
  }

  function handleRejectSpin() {
    rejectLastSpin();
    setCenterEmoji('?');
    setShowWheel(true);
  }

  // Progress dots: filled based on committed animals
  const dot1Filled = pickedAnimals.length >= 1;
  const dot2Filled = pickedAnimals.length >= 2;

  const isPreviewPhase = !showWheel && !isSpinning;
  const previewAnimal = pickedAnimals[pickedAnimals.length - 1] ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <Confetti active={confetti} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>A daily discovery for curious kids</Text>
          <Text style={styles.title}>🌿 Safari <Text style={styles.titleAccent}>Adventure</Text></Text>
          <Text style={styles.sub}>Spin the wheel to reveal two amazing animals from across the wild world</Text>
        </View>

        <View style={styles.shell}>
          {(phase === 'spin' || phase === 'confirm') && (
            <View style={styles.spinPhase}>
              {/* Progress dots */}
              <View style={styles.dots}>
                <View style={[styles.dot, dot1Filled && styles.dotFilled]} />
                <View style={[styles.dot, dot2Filled && styles.dotFilled]} />
              </View>

              {/* Wheel — shown while spinning or before first spin */}
              {showWheel && (
                <>
                  <Text style={styles.spinLabel}>
                    {spinCount === 0 ? 'Spin for animal 1 of 2' : 'Spin for animal 2 of 2'}
                  </Text>
                  <SpinWheel
                    rotation={rotation}
                    emojis={displayEmojis}
                    centerEmoji={centerEmoji}
                    onSpin={handleSpin}
                    disabled={isSpinning}
                  />
                </>
              )}

              {/* Preview — shown after each spin, replacing the wheel */}
              {isPreviewPhase && previewAnimal && (
                <>
                  <Text style={styles.spinLabel}>
                    {phase === 'confirm' ? `You found ${previewAnimal.name}!` : `You found ${previewAnimal.name}!`}
                  </Text>
                  <AnimalPreview animal={previewAnimal} />

                  {phase === 'confirm' ? (
                    // After spin 2 — proceed or re-spin
                    <>
                      <Pressable style={styles.proceedBtn} onPress={confirmAnimals}>
                        <Text style={styles.proceedBtnText}>See both animals! →</Text>
                      </Pressable>
                      <Pressable style={styles.reSpinBtn} onPress={handleRejectSpin}>
                        <Text style={styles.reSpinBtnText}>↺  Spin again for a different animal</Text>
                      </Pressable>
                    </>
                  ) : (
                    // After spin 1 — spin again for animal 2
                    <Pressable style={styles.proceedBtn} onPress={handleSpin}>
                      <Text style={styles.proceedBtnText}>Spin for animal 2 →</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

          {phase === 'result' && (
            <View>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Today's wild discoveries</Text>
                <Text style={styles.resultsSub}>Tap the sound button to hear each animal!</Text>
              </View>

              {pickedAnimals.map((animal, i) => (
                <AnimalCard key={animal.name + i} animal={animal} />
              ))}

              <Pressable style={styles.resetBtn} onPress={() => { reset(); setShowWheel(true); setCenterEmoji('?'); }}>
                <Text style={styles.resetBtnText}>New expedition!</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Text style={styles.footer}>Photos via Wikipedia · Sounds via Wikimedia Commons</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.jungleDarkest },
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 60 },
  header: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 20 },
  eyebrow: { fontSize: 12, letterSpacing: 2.5, textTransform: 'uppercase', color: colors.leafLight, marginBottom: 8 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 40, color: colors.cream, textAlign: 'center' },
  titleAccent: { color: colors.amber },
  sub: { marginTop: 10, fontSize: 15, color: colors.leafPale, textAlign: 'center', maxWidth: 320 },
  shell: { paddingHorizontal: 20 },
  spinPhase: { alignItems: 'center', gap: 16 },
  dots: { flexDirection: 'row', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.jungleLight },
  dotFilled: { backgroundColor: colors.amber, borderColor: colors.amber },
  spinLabel: { fontSize: 14, color: colors.leafLight, letterSpacing: 1, fontWeight: '600', textTransform: 'uppercase' },
  resultsHeader: { alignItems: 'center', marginBottom: 28 },
  resultsTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.cream },
  resultsSub: { fontSize: 13, color: colors.leafLight, marginTop: 4 },
  resetBtn: {
    borderWidth: 2, borderColor: colors.amber, borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 44, alignSelf: 'center', marginTop: 32,
  },
  resetBtnText: { fontSize: 16, fontWeight: '700', color: colors.amber, letterSpacing: 1 },
  footer: { textAlign: 'center', fontSize: 12, color: colors.jungleLight, opacity: 0.7, marginTop: 20 },
  proceedBtn: {
    backgroundColor: colors.amber, borderRadius: 50,
    paddingVertical: 16, paddingHorizontal: 44, alignSelf: 'center',
  },
  proceedBtnText: { fontSize: 17, fontWeight: '700', color: colors.bark, letterSpacing: 0.5 },
  reSpinBtn: { alignSelf: 'center', marginTop: 10, padding: 10 },
  reSpinBtnText: { fontSize: 14, color: colors.leafLight, fontWeight: '600' },
});
