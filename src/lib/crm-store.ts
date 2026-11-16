import fs from 'node:fs';
import path from 'node:path';
import { crmStore as memory, type ProspectItem } from './crm';

/**
 * Server-only CRM store: the in-memory store from ./crm, saved to data/crm-prospects.json
 * (owner-only file) after every change and loaded from it on first use, so prospects survive
 * a server restart. ./crm stays free of Node APIs because client components import it.
 * Before deploying to serverless, move this to the database: the data folder is not durable there.
 */

const FILE = path.join(process.cwd(), 'data', 'crm-prospects.json');
const g = globalThis as unknown as { __lumo_crm_loaded?: boolean };

function ensureLoaded() {
  if (g.__lumo_crm_loaded) return;
  g.__lumo_crm_loaded = true;
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (Array.isArray(raw)) {
      const list = memory.getAll();
      list.splice(0, list.length, ...(raw as ProspectItem[]));
    }
  } catch { /* first run: keep the seed, it is saved on the first change */ }
}

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(memory.getAll(), null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmp, FILE);
}

/** Wrap a mutating method: load first, run it on the memory store, then save. */
function write<A extends unknown[], R>(fn: (...args: A) => R) {
  return (...args: A): R => {
    ensureLoaded();
    const result = fn.apply(memory, args);
    save();
    return result;
  };
}

export const crmStore = {
  getAll(): ProspectItem[] { ensureLoaded(); return memory.getAll(); },
  getById(id: string) { ensureLoaded(); return memory.getById(id); },
  findByPhone(phone: string) { ensureLoaded(); return memory.findByPhone(phone); },
  create: write(memory.create),
  importMany: write(memory.importMany),
  updateStage: write(memory.updateStage),
  setOptOut: write(memory.setOptOut),
  incrementFollowUp: write(memory.incrementFollowUp),
  updateSignals: write(memory.updateSignals),
  updateDetails: write(memory.updateDetails),
  addNote: write(memory.addNote),
};
