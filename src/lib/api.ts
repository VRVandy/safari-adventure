import { Animal } from '@/types/animal';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:3001';
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// ── Mock animals (used when EXPO_PUBLIC_USE_MOCK=true) ──────────────────────
const MOCK_ANIMALS: Animal[] = [
  {
    name: 'Lion',
    scientificName: 'Panthera leo',
    habitat: 'African savanna',
    type: 'Mammal',
    emoji: '🦁',
    facts: [
      'Lions are the only cats that live in groups called prides — a pride can have up to 30 lions!',
      'A lion\'s roar is so loud it can be heard from 8 kilometres away.',
      'Female lions (lionesses) do most of the hunting for the pride.',
    ],
    soundDescription: 'deep rumbling roar',
    hasMakeableSound: true,
    wikiSoundUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Lion_Roar.ogg',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/640px-Lion_waiting_in_Namibia.jpg',
  },
  {
    name: 'African Elephant',
    scientificName: 'Loxodonta africana',
    habitat: 'African savanna & forest',
    type: 'Mammal',
    emoji: '🐘',
    facts: [
      'Elephants are the largest land animals on Earth and can weigh up to 6,000 kg!',
      'They use their trunks like a hand — to pick up food, drink water, and even hug each other.',
      'Elephants never forget — they can remember friends and family after many years apart.',
    ],
    soundDescription: 'loud trumpeting blast',
    hasMakeableSound: true,
    wikiSoundUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Elephant_trumpet.ogg',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/African_Bush_Elephant.jpg/640px-African_Bush_Elephant.jpg',
  },
];

let mockIndex = 0;

function getNextMockAnimal(): Animal {
  const animal = MOCK_ANIMALS[mockIndex % MOCK_ANIMALS.length];
  mockIndex++;
  return animal;
}

// ── Real API calls ──────────────────────────────────────────────────────────
export async function fetchAnimal(previousAnimals: string[]): Promise<Animal> {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200));
    return getNextMockAnimal();
  }
  const res = await fetch(`${SERVER_URL}/api/animal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ previousAnimals }),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

export async function fetchMoreFacts(
  animal: Animal,
  existingFacts: string[]
): Promise<string[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 800));
    return [
      `${animal.name}s have a lifespan of 10–20 years in the wild.`,
      'Scientists study them to understand animal behaviour and conservation.',
      'They play an important role in keeping their ecosystem in balance.',
    ];
  }
  const res = await fetch(`${SERVER_URL}/api/animal/more-facts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ animal, existingFacts }),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  return data.facts;
}
