import { useState, useRef, useCallback } from 'react';
import { Animal } from '@/types/animal';
import { fetchAnimal } from '@/lib/api';
import { fetchWikiImage } from '@/lib/wikiImage';
import { fetchWikiSound } from '@/lib/wikiSound';

type Phase = 'spin' | 'confirm' | 'result';

export function useAnimalData() {
  const [phase, setPhase] = useState<Phase>('spin');
  const [spinCount, setSpinCount] = useState(0);
  const [pickedAnimals, setPickedAnimals] = useState<Animal[]>([]);
  const previousNames = useRef<string[]>([]);

  // Stage 1: fetch only the Claude animal — resolves fast so the wheel
  // reveal is instant. Image + sound are fetched separately in stage 2.
  const startFetch = useCallback((): Promise<Animal | null> => {
    return fetchAnimal(previousNames.current)
      .then(animal => {
        previousNames.current = [...previousNames.current, animal.name].slice(-20);
        return animal;
      })
      .catch(() => null);
  }, []);

  // Stage 2: enrich a committed animal with image + sound in the background.
  // Updates the matching entry in pickedAnimals when both arrive.
  const enrichAnimal = useCallback((animal: Animal) => {
    Promise.all([
      fetchWikiImage(animal.name, animal.scientificName),
      animal.hasMakeableSound ? fetchWikiSound(animal.name) : Promise.resolve(null),
    ]).then(([imageUrl, soundUrl]) => {
      setPickedAnimals(prev =>
        prev.map(a =>
          a.name === animal.name
            ? { ...a, imageUrl, wikiSoundUrl: soundUrl ?? a.wikiSoundUrl }
            : a
        )
      );
    });
  }, []);

  const commitSpin = useCallback((animal: Animal) => {
    const next = spinCount + 1;
    setSpinCount(next);
    if (next === 1) {
      setPickedAnimals([animal]);
      enrichAnimal(animal);
    } else {
      setPickedAnimals(prev => [...prev, animal]);
      setPhase('confirm');
      enrichAnimal(animal);
    }
  }, [spinCount, enrichAnimal]);

  const confirmAnimals = useCallback(() => setPhase('result'), []);

  const rejectLastSpin = useCallback(() => {
    setPickedAnimals(prev => prev.slice(0, 1));
    setSpinCount(1);
    setPhase('spin');
  }, []);

  const reset = useCallback(() => {
    setPhase('spin');
    setSpinCount(0);
    setPickedAnimals([]);
  }, []);

  return { phase, spinCount, pickedAnimals, startFetch, commitSpin, confirmAnimals, rejectLastSpin, reset };
}
