import type { Difficulty } from "@/domain/generator";
import type { SessionState, SessionSummary } from "./session-machine";

const VERSION = 1;
const PREFIX = `algebra-arcade:v${VERSION}:`;

const KEYS = {
  activeSession: `${PREFIX}active-session`,
  difficulty: `${PREFIX}difficulty`,
  completedSummaries: `${PREFIX}completed-summaries`,
  theme: `${PREFIX}theme`,
  sound: `${PREFIX}sound`,
} as const;

export type ThemePreference = "light" | "dark" | "system";

export type StoredSummary = SessionSummary & { completedAt: string; difficulty: Difficulty };

function hasStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

function readJSON<T>(key: string): T | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (e.g. private browsing): fail silently, nothing to persist locally.
  }
}

export function saveActiveSession(state: SessionState): void {
  writeJSON(KEYS.activeSession, state);
}

export function loadActiveSession(): SessionState | null {
  return readJSON<SessionState>(KEYS.activeSession);
}

export function clearActiveSession(): void {
  if (!hasStorage()) return;
  window.localStorage.removeItem(KEYS.activeSession);
}

export function saveDifficulty(difficulty: Difficulty): void {
  writeJSON(KEYS.difficulty, difficulty);
}

export function loadDifficulty(): Difficulty | null {
  return readJSON<Difficulty>(KEYS.difficulty);
}

const MAX_STORED_SUMMARIES = 20;

export function saveCompletedSummary(summary: StoredSummary): void {
  const existing = loadCompletedSummaries();
  const next = [summary, ...existing].slice(0, MAX_STORED_SUMMARIES);
  writeJSON(KEYS.completedSummaries, next);
}

export function loadCompletedSummaries(): StoredSummary[] {
  return readJSON<StoredSummary[]>(KEYS.completedSummaries) ?? [];
}

export function saveThemePreference(theme: ThemePreference): void {
  writeJSON(KEYS.theme, theme);
}

export function loadThemePreference(): ThemePreference {
  return readJSON<ThemePreference>(KEYS.theme) ?? "system";
}

export function saveSoundPreference(enabled: boolean): void {
  writeJSON(KEYS.sound, enabled);
}

export function loadSoundPreference(): boolean {
  return readJSON<boolean>(KEYS.sound) ?? false;
}
