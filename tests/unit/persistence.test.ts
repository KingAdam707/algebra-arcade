import { beforeEach, describe, expect, it } from "vitest";
import { constantTerm, xTerm } from "@/domain/equation";
import { fromInt } from "@/domain/rational";
import { createSessionFromQuestions } from "@/state/session-machine";
import {
  clearActiveSession,
  loadActiveSession,
  loadCompletedSummaries,
  loadDifficulty,
  loadSoundPreference,
  loadThemePreference,
  saveActiveSession,
  saveCompletedSummary,
  saveDifficulty,
  saveSoundPreference,
  saveThemePreference,
} from "@/state/persistence";

beforeEach(() => {
  window.localStorage.clear();
});

describe("persistence", () => {
  it("round-trips an active session", () => {
    const state = createSessionFromQuestions("easy", [
      {
        equation: { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] },
        solution: fromInt(8),
        difficulty: "easy",
        startingCoefficientSign: "positive",
        xOnLeft: true,
      },
    ]);
    saveActiveSession(state);
    expect(loadActiveSession()).toEqual(state);
  });

  it("clears the active session", () => {
    const state = createSessionFromQuestions("easy", [
      {
        equation: { left: [xTerm(fromInt(1))], right: [constantTerm(fromInt(4))] },
        solution: fromInt(4),
        difficulty: "easy",
        startingCoefficientSign: "positive",
        xOnLeft: true,
      },
    ]);
    saveActiveSession(state);
    clearActiveSession();
    expect(loadActiveSession()).toBeNull();
  });

  it("defaults difficulty and preferences when nothing is stored", () => {
    expect(loadDifficulty()).toBeNull();
    expect(loadThemePreference()).toBe("system");
    expect(loadSoundPreference()).toBe(false);
  });

  it("persists difficulty and preferences", () => {
    saveDifficulty("hard");
    saveThemePreference("dark");
    saveSoundPreference(true);
    expect(loadDifficulty()).toBe("hard");
    expect(loadThemePreference()).toBe("dark");
    expect(loadSoundPreference()).toBe(true);
  });

  it("caps and orders completed session summaries newest-first", () => {
    for (let i = 0; i < 25; i++) {
      saveCompletedSummary({
        completedAt: new Date(2026, 0, i + 1).toISOString(),
        difficulty: "easy",
        questionsSolved: i,
        strongestSkill: null,
        weakestSkill: null,
        skillTallies: {
          "make-x-positive": { attempts: 0, correctFirstTry: 0 },
          "choose-inverse": { attempts: 0, correctFirstTry: 0 },
          "apply-both-sides": { attempts: 0, correctFirstTry: 0 },
          "simplify-numbers": { attempts: 0, correctFirstTry: 0 },
          "divide-coefficient": { attempts: 0, correctFirstTry: 0 },
          fractions: { attempts: 0, correctFirstTry: 0 },
        },
      });
    }
    const stored = loadCompletedSummaries();
    expect(stored).toHaveLength(20);
    expect(stored[0].questionsSolved).toBe(24);
  });
});
