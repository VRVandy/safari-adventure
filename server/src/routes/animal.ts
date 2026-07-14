import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

export const animalRouter = Router();

const FAST_MODEL = 'claude-haiku-4-5-20251001'; // animal fetch — speed matters
const MODEL = 'claude-sonnet-4-6';              // more facts — quality matters

// Lazy init so dotenv has loaded by the time the first request comes in
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const CLASSES = [
  'Mammal','Mammal','Mammal',
  'Bird','Bird',
  'Reptile','Fish','Amphibian','Insect','Arachnid','Mollusc','Crustacean',
];
const CONTINENTS = ['Africa','Asia','Europe','North America','South America','Australia','Antarctica'];

// POST /api/animal
// Body: { previousAnimals: string[] }
animalRouter.post('/', async (req: Request, res: Response) => {
  const { previousAnimals = [] } = req.body as { previousAnimals?: string[] };
  const exclusion = previousAnimals.length
    ? `Do NOT choose any of these: ${previousAnimals.join(', ')}.`
    : '';

  const randomClass = CLASSES[Math.floor(Math.random() * CLASSES.length)];
  const randomContinent = CONTINENTS[Math.floor(Math.random() * CONTINENTS.length)];
  const seed = Math.floor(Math.random() * 9000) + 1000;

  try {
    const message = await getClient().messages.create({
      model: FAST_MODEL,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Pick ONE random ${randomClass} from ${randomContinent} (random seed: ${seed}). ${exclusion}
Strongly prefer obscure, lesser-known species that most people have never heard of — avoid the most famous or iconic examples of the class. Avoid: deep ocean or abyssal creatures (anglerfish, blobfish, gulper eel, giant squid, etc.), venomous or dangerous spiders and insects (funnel-web spider, bullet ant, giant centipede, etc.), and parasites or microscopic organisms (tapeworm, botfly, tongue louse, etc.). Choose an animal that is visually appealing and not frightening to a 4-year-old child.
Return ONLY valid JSON, no markdown, no extra text:
{
  "name": "common animal name",
  "scientificName": "latin scientific name",
  "habitat": "2-3 word habitat description",
  "type": "animal class e.g. Mammal, Bird, Reptile, Fish, Insect, Amphibian",
  "emoji": "single best matching emoji for this specific animal",
  "facts": ["engaging fun fact for a 5-10 year old child", "second fun fact", "third fun fact"],
  "soundDescription": "4-6 words describing the sound e.g. deep rumbling roar",
  "hasMakeableSound": true,
  "wikiSoundUrl": null
}`,
      }],
    });

    const raw = message.content.map(c => (c.type === 'text' ? c.text : '')).join('');
    const animal = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json(animal);
  } catch (err) {
    console.error('Animal fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch animal' });
  }
});

// POST /api/animal/more-facts
// Body: { animal: Animal, existingFacts: string[] }
animalRouter.post('/more-facts', async (req: Request, res: Response) => {
  const { animal, existingFacts = [] } = req.body as {
    animal: { name: string; scientificName: string };
    existingFacts?: string[];
  };

  try {
    const message = await getClient().messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Give me 3 more fun facts about the ${animal.name} (${animal.scientificName}) for a 5-10 year old child.
These facts are already known, do not repeat them: ${existingFacts.join(' | ')}
Return ONLY a JSON array of 3 strings, no markdown: ["fact1","fact2","fact3"]`,
      }],
    });

    const raw = message.content.map(c => (c.type === 'text' ? c.text : '')).join('');
    const facts = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json({ facts });
  } catch (err) {
    console.error('More facts error:', err);
    res.status(500).json({ error: 'Failed to fetch more facts' });
  }
});
