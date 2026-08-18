/** A source of numbers in [0, 1). Swap in a seeded implementation for deterministic tests. */
export type RandomSource = () => number;

/** mulberry32: small, fast, deterministic PRNG suitable for seeded tests. */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: RandomSource, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function randomSign(rng: RandomSource, negativeProbability: number): 1 | -1 {
  return rng() < negativeProbability ? -1 : 1;
}

export function chance(rng: RandomSource, probability: number): boolean {
  return rng() < probability;
}

export function pick<T>(rng: RandomSource, options: readonly T[]): T {
  return options[randomInt(rng, 0, options.length - 1)];
}
