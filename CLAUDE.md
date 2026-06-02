# Safari Adventure — Claude Context

A children's animal discovery app. Kids spin a wheel twice to reveal two random animals, then see Wikipedia photos, fun facts, and inline animal sounds.

## Architecture

Two separate deployable units:

| Unit | Tech | Hosted on |
|------|------|-----------|
| Frontend | Expo SDK 56 + React Native Web | Netlify |
| Backend | Express + TypeScript | Railway |

The backend exists solely to keep the Anthropic API key off the client. All Claude API calls go through it.

---

## Key URLs

- **Live app**: https://vermillion-unicorn-516a8d.netlify.app
- **Railway server**: https://safari-adventure-production.up.railway.app
- **Health check**: https://safari-adventure-production.up.railway.app/health → `{"ok":true}`
- **GitHub repo**: https://github.com/VRVandy/safari-adventure

---

## Project Structure

```
safari-adventure-fresh/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root layout — fonts, Stack navigator, dark bg
│   └── index.tsx               # Main screen — all 3 phases: spin/confirm/result
├── src/
│   ├── components/
│   │   ├── SpinWheel.tsx       # SVG wheel (react-native-svg + Reanimated 4)
│   │   ├── AnimalCard.tsx      # Card with photo, facts, sound, "more facts"
│   │   ├── SoundButton.tsx     # Inline audio player (web: HTML5 Audio, native: expo-audio)
│   │   └── Confetti.tsx        # Brief confetti burst on animal reveal
│   ├── hooks/
│   │   ├── useSpinWheel.ts     # Reanimated rotation + emoji shuffle
│   │   └── useAnimalData.ts    # Phase state machine + 2-stage fetch + localStorage
│   ├── lib/
│   │   ├── api.ts              # fetch wrappers — fetchAnimal, fetchMoreFacts
│   │   ├── wikiImage.ts        # Wikipedia image lookup by animal name
│   │   └── wikiSound.ts        # Wikimedia Commons sound file lookup
│   ├── constants/
│   │   └── theme.ts            # Colors, wheel sector colors, 20 WHEEL_EMOJIS
│   └── types/
│       └── animal.ts           # Animal interface
├── server/
│   ├── src/
│   │   ├── index.ts            # Express app — CORS, rate limiting, /health
│   │   └── routes/animal.ts    # POST /api/animal, POST /api/animal/more-facts
│   ├── railway.json            # Railway build/start config
│   └── package.json
├── netlify.toml                # Netlify build command + publish dir
└── .env                        # Local only — EXPO_PUBLIC_SERVER_URL, EXPO_PUBLIC_USE_MOCK
```

---

## How the App Works

### Phase state machine (`useAnimalData.ts`)
```
'spin' → (2nd spin completes) → 'confirm' → (user taps "See your animals") → 'result'
         (user taps "Spin again")  ↗
```

### Two-stage animal fetch (keeps reveal instant)
1. **Stage 1** — starts when the wheel starts spinning: `fetchAnimal()` calls the backend → Claude returns name/facts/emoji. Resolves in ~2-3s, usually before the 3.6s spin ends.
2. **Stage 2** — after reveal: `enrichAnimal()` fetches Wikipedia image + Wikimedia sound in the background. Card updates when they arrive.

### Repeat prevention
- `previousNames` ref in `useAnimalData.ts` tracks last 20 animal names
- Persisted in `localStorage` under key `safari_seen_animals` — survives page refresh and next-day visits
- Sent to server with every spin; Claude is told to exclude them

---

## Backend (`server/`)

### Routes
- `POST /api/animal` — picks a random animal via Claude, returns Animal JSON
- `POST /api/animal/more-facts` — returns 3 more facts for a given animal
- `GET /health` — returns `{"ok":true}`, used by Railway healthcheck

### Key settings
- Model: `claude-sonnet-4-6`
- `max_tokens: 400` for animal fetch (keeps response fast)
- `max_tokens: 600` for more-facts
- Rate limit: **20 requests/hour per IP** (`express-rate-limit`)
- CORS: controlled by `ALLOWED_ORIGINS` env var (comma-separated)

### Lazy Anthropic client init
```typescript
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}
```
Avoids reading the API key before dotenv loads.

---

## Environment Variables

### Local (`.env` — gitignored)
```
EXPO_PUBLIC_SERVER_URL=http://localhost:3001
EXPO_PUBLIC_USE_MOCK=false
```

### Railway dashboard (server)
| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (from console.anthropic.com) |
| `ALLOWED_ORIGINS` | `https://vermillion-unicorn-516a8d.netlify.app` |

### Netlify dashboard (frontend build)
| Variable | Value |
|----------|-------|
| `EXPO_PUBLIC_SERVER_URL` | `https://safari-adventure-production.up.railway.app` |
| `EXPO_PUBLIC_USE_MOCK` | `false` |

---

## Local Development

```bash
# Terminal 1 — backend
cd server
npm run dev          # uses tsx --env-file=.env watch

# Terminal 2 — frontend
npx expo start       # press W for web
# Add --clear if Metro feels slow or stale
```

**Note:** First load in dev is slow (Metro bundles on demand). Use `npx expo start --clear` when it gets sluggish. The deployed Netlify version loads near-instantly.

### Mock mode (no API key needed)
Set `EXPO_PUBLIC_USE_MOCK=true` in `.env`. Returns hardcoded Lion + African Elephant with real Wikipedia images/sounds. Useful for UI work without burning API credits.

---

## Deploying Changes

### Frontend change (anything in `app/` or `src/`)
Push to GitHub → Netlify auto-rebuilds (~2 min). No Railway action needed.

### Backend change (anything in `server/`)
Push to GitHub → Railway auto-redeploys (~1 min).
If Railway doesn't auto-deploy: Deployments tab → three dots on latest → Redeploy.

### Both changed
Push once — both platforms pick up the change independently.

---

## Common Debug Scenarios

### Wheel spins but no animal appears
1. Open browser DevTools (F12) → Console tab → look for red errors
2. `500` error → Railway issue → check Railway logs (Deployments → View logs)
3. `authentication_error` in logs → `ANTHROPIC_API_KEY` wrong/missing in Railway Variables
4. CORS error → `ALLOWED_ORIGINS` in Railway doesn't match the Netlify URL

### Animal appears but no photo
Wikipedia image lookup failed silently — expected for obscure animals. Card shows emoji placeholder as fallback.

### Sound button searches instead of playing
Wikimedia Commons had no audio file for that animal. Falls back to Google video search — intentional behaviour.

### Rate limit hit
Users get an error after ~20 spins/hour per IP. Raise `max` in `rateLimit()` in `server/src/index.ts`.

### Netlify build fails
Check build log in Netlify dashboard. Most common cause: missing env vars (`EXPO_PUBLIC_SERVER_URL`) in Netlify site settings.

### Railway not auto-deploying after a push
The GitHub webhook sometimes breaks. Fix: Railway → service Settings → disconnect and reconnect the GitHub repo. This re-registers the webhook.

---

## Key Technical Decisions & Gotchas

- **`app/` at project root** — expo-router scans from root. Putting screens inside `src/` caused all components to be treated as routes. Do not move `app/` into `src/`.
- **Reanimated 4.x** — does NOT need `react-native-reanimated/plugin` in `babel.config.js`. Remove it if it appears.
- **`react-native-worklets@0.8.0`** — must be exactly 0.8.0. Version 0.9.x is incompatible with Reanimated 4.3.1.
- **`web.output: "single"`** in `app.json` — `"static"` causes React version mismatch errors on web.
- **No SVG Circle in SpinWheel** — the center hub is a View overlay only. Adding an SVG Circle causes a double-circle visual bug.
- **`wikiSoundUrl` is always `null` from Claude** — Claude hallucinates Wikimedia URLs. Real URLs are looked up separately via `wikiSound.ts` after the animal is committed.
- **Path alias `@/*` → `src/*`** — defined in `tsconfig.json`. Use `@/components/Foo`, not relative paths.
- **Anthropic API key** — stored only in Railway Variables and local `server/.env` (gitignored). Never in code or GitHub. Get/create keys at console.anthropic.com (separate from claude.ai subscription).
