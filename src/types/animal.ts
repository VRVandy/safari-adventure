export interface Animal {
  name: string;
  scientificName: string;
  habitat: string;
  type: string;
  emoji: string;
  facts: string[];
  soundDescription: string;
  hasMakeableSound: boolean;
  wikiSoundUrl: string | null;
  imageUrl?: string | null;
}
