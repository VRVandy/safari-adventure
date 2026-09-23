import fs from 'fs';
import path from 'path';

export interface TraceEvent {
  type:
    | 'animal_fetch'
    | 'more_facts_fetch';
  timestamp: string;
  durationMs: number;
  input: {
    previousAnimals?: string[];
    animalName?: string;
    scientificName?: string;
    existingFacts?: string[];
  };
  prompt: {
    model: string;
    maxTokens: number;
    userMessage: string;
  };
  rawResponse: string;
  parsedOutput: unknown;
  error?: string;
  // Injected context used to build the prompt
  injectedContext?: {
    randomClass?: string;
    randomContinent?: string;
    seed?: number;
    exclusionList?: string[];
  };
}

interface Session {
  sessionId: string;
  startedAt: string;
  events: TraceEvent[];
  flushTimer: ReturnType<typeof setTimeout> | null;
}

const IDLE_FLUSH_MS = 30_000; // flush session after 30s of inactivity
const TRACES_FILE = path.join(process.cwd(), 'traces.jsonl');

const sessions = new Map<string, Session>();

function getOrCreate(sessionId: string): Session {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      startedAt: new Date().toISOString(),
      events: [],
      flushTimer: null,
    });
  }
  return sessions.get(sessionId)!;
}

function flush(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session || session.events.length === 0) {
    sessions.delete(sessionId);
    return;
  }
  const record = {
    sessionId: session.sessionId,
    startedAt: session.startedAt,
    completedAt: new Date().toISOString(),
    eventCount: session.events.length,
    events: session.events,
  };
  try {
    fs.appendFileSync(TRACES_FILE, JSON.stringify(record) + '\n', 'utf8');
    console.log(`[trace] flushed session ${sessionId} (${session.events.length} events)`);
  } catch (err) {
    console.error('[trace] failed to write trace:', err);
  }
  sessions.delete(sessionId);
}

function scheduleFlush(session: Session) {
  if (session.flushTimer) clearTimeout(session.flushTimer);
  session.flushTimer = setTimeout(() => flush(session.sessionId), IDLE_FLUSH_MS);
}

export function appendEvent(sessionId: string, event: TraceEvent) {
  const session = getOrCreate(sessionId);
  session.events.push(event);
  scheduleFlush(session);
}

// Flush all in-flight sessions on shutdown
export function flushAll() {
  for (const sessionId of sessions.keys()) {
    flush(sessionId);
  }
}
