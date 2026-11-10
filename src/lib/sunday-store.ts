import fs from 'node:fs';
import path from 'node:path';
import { mondayOf, type SundayReview } from './sunday-dashboard';

/**
 * The Sunday review: this week's numbers plus the closed weeks (data/sunday.json, owner-only file).
 * Before deploying to serverless, move this to the database: the data folder is not durable there.
 */

const FILE = path.join(process.cwd(), 'data', 'sunday.json');
const MAX_HISTORY = 104;

interface Board { current: SundayReview; history: SundayReview[] }

const blank = (): SundayReview => ({
  weekOf: mondayOf(),
  milestone: 14,
  hours: { luisHours: 0, carlosHours: 0, barbaraHours: 0, contactsThisWeek: 0 },
  metrics: { contacts: 0, diagnoses: 0, meetings: 0, closedClients: 0, mrr: 0 },
  notes: '',
});

let cache: Board | null = null;

function load(): Board {
  if (cache) return cache;
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (raw?.current && Array.isArray(raw.history)) cache = raw as Board;
  } catch { /* first run */ }
  if (!cache) cache = { current: blank(), history: [] };
  return cache;
}

function save(b: Board) {
  cache = b;
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(b, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmp, FILE);
}

export const sundayStore = {
  get(): Board { return load(); },

  saveCurrent(review: Omit<SundayReview, 'weekOf' | 'savedBy' | 'savedAt'>, by: string): Board {
    const b = load();
    const next: Board = { ...b, current: { ...review, weekOf: b.current.weekOf, savedBy: by, savedAt: new Date().toISOString() } };
    save(next);
    return next;
  },

  /** Close the week: keep a copy in the history and start the next week with the same goals and numbers. */
  closeWeek(by: string): Board {
    const b = load();
    const closed = { ...b.current, savedBy: by, savedAt: new Date().toISOString() };
    const history = [closed, ...b.history.filter((h) => h.weekOf !== closed.weekOf)].slice(0, MAX_HISTORY);
    const nextMonday = new Date(Date.parse(closed.weekOf + 'T12:00:00Z') + 7 * 86_400_000);
    const weekOf = mondayOf(new Date(Math.max(nextMonday.getTime(), Date.parse(mondayOf() + 'T12:00:00Z'))));
    const current: SundayReview = {
      ...closed, weekOf, notes: '', savedBy: undefined, savedAt: undefined,
      hours: { luisHours: 0, carlosHours: 0, barbaraHours: 0, contactsThisWeek: 0 },
    };
    const next = { current, history };
    save(next);
    return next;
  },
};
