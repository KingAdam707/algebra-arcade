"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { SHIP, drawPixelGrid, pixelGridWidth } from "./pixel-sprites";
import { pixelFont } from "./pixel-font";

/** The ship's ammunition: operators, hunting down the numbers and letters. */
const OPERATORS = ["+", "-", "×", "÷"];
/** The enemies: the numbers and letters an operator would act on. */
const INVADER_GLYPHS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "x", "y", "z", "a", "b", "n"];

/** Fixed palette for the hero/strip variants, which render as a self-contained dark "screen" panel. */
const PANEL_COLORS = {
  panelBg: "#080a14",
  invader: "#8ea2ff",
  invaderHit: "#eef0fa",
  ship: "#eef0fa",
  bullet: "#ffd76a",
  star: "#22283f",
};

type Palette = typeof PANEL_COLORS;

/** For the seamless "side" variant: reads the app's actual theme tokens so it always matches the page. */
function readThemeColors(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    panelBg: "transparent",
    invader: read("--accent", "#2f53e0"),
    invaderHit: read("--ink", "#161b2e"),
    ship: read("--ink", "#161b2e"),
    bullet: read("--accent-strong", "#223fb8"),
    star: read("--border", "#dcdfec"),
  };
}

type Variant = "hero" | "strip" | "side";

/** Falling-rain behaviour, only used by the "side" variant. */
type FallConfig = {
  speedRange: [number, number];
  gravity: number;
  spawnIntervalMs: [number, number];
  batchRange: [number, number];
  hitRadiusX: number;
  hitRadiusY: number;
};

type VariantConfig = {
  cols: number;
  /** Fixed row count for the grid variants, or null (unused) for the falling "side" variant. */
  rows: number | null;
  /** Fixed panel height in px, or null to fill the parent container's measured height. */
  heightPx: number | null;
  seamless: boolean;
  shipPixelSize: number;
  invaderFontPx: number;
  bulletFontPx: number;
  cellWidth: number;
  cellHeight: number;
  driftFactor: number;
  bulletIntervalMs: [number, number];
  bulletSpeed: number;
  starCount: number;
  fall: FallConfig | null;
};

const CONFIG: Record<Variant, VariantConfig> = {
  hero: {
    cols: 6,
    rows: 3,
    heightPx: 260,
    seamless: false,
    shipPixelSize: 3,
    invaderFontPx: 16,
    bulletFontPx: 14,
    cellWidth: 62,
    cellHeight: 42,
    driftFactor: 0.08,
    bulletIntervalMs: [450, 850],
    bulletSpeed: 0.09,
    starCount: 40,
    fall: null,
  },
  strip: {
    cols: 7,
    rows: 1,
    heightPx: 34,
    seamless: false,
    shipPixelSize: 1.4,
    invaderFontPx: 10,
    bulletFontPx: 9,
    cellWidth: 30,
    cellHeight: 16,
    driftFactor: 0.08,
    bulletIntervalMs: [900, 1700],
    bulletSpeed: 0.06,
    starCount: 14,
    fall: null,
  },
  side: {
    cols: 1,
    rows: null,
    heightPx: null,
    seamless: true,
    shipPixelSize: 2.6,
    invaderFontPx: 15,
    bulletFontPx: 12,
    cellWidth: 40,
    cellHeight: 56,
    driftFactor: 0.35,
    bulletIntervalMs: [650, 1200],
    bulletSpeed: 0.09,
    starCount: 24,
    fall: {
      speedRange: [0.045, 0.075],
      gravity: 0.00003,
      spawnIntervalMs: [1100, 2200],
      batchRange: [1, 3],
      hitRadiusX: 22,
      hitRadiusY: 16,
    },
  },
};

type Bullet = { x: number; y: number; char: string; vy: number };
/** Static formation invader, used by the hero/strip grid variants. */
type GridInvader = { col: number; row: number; char: string; alive: boolean; hitUntil: number; respawnAt: number };
/** Free-falling invader, used by the "side" variant: spawns at the top, falls under gravity, no formation. */
type FallingInvader = { x: number; y: number; vy: number; char: string; hitUntil: number; dying: boolean; removeAt: number };
type Star = { x: number; y: number; r: number };

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function pickFrom(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Decorative 8-bit arcade scene: a ship fires operators (+ - x div) upward.
 * Purely atmospheric branding for "Algebra Arcade" — no game state, no
 * interaction, always aria-hidden. hero/strip show a gently drifting fixed
 * formation of number/letter invaders in a self-contained dark panel. side
 * is seamless (no panel background or border, live theme colours) and
 * starts empty: invaders fall from the top under light gravity, a few at a
 * time, at random positions — no formation.
 */
export function SpaceInvadersScene({ variant }: { variant: Variant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = CONFIG[variant];
    const isFalling = config.fall !== null;
    let colors: Palette = config.seamless ? readThemeColors() : PANEL_COLORS;

    let width = 0;
    let height = 0;
    let rows = config.rows ?? 6;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let gridInvaders: GridInvader[] = [];
    let fallingInvaders: FallingInvader[] = [];

    function buildGridInvaders() {
      gridInvaders = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          gridInvaders.push({ col, row, char: pickFrom(INVADER_GLYPHS), alive: true, hitUntil: 0, respawnAt: 0 });
        }
      }
    }

    function measure() {
      if (!canvas || !container) return;
      width = container.clientWidth;
      height = config.heightPx ?? container.clientHeight;
      if (config.rows === null) {
        const usableHeight = Math.max(0, height - 90);
        rows = Math.max(4, Math.floor(usableHeight / config.cellHeight));
      }
    }

    function resize() {
      if (!canvas || !container) return;
      measure();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (ctx) ctx.imageSmoothingEnabled = false;
    }

    const stars: Star[] = Array.from({ length: config.starCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: randomBetween(0.5, 1.4),
    }));

    let bullets: Bullet[] = [];
    let nextBulletAt = 0;
    let nextSpawnAt = 0;
    let elapsed = 0;
    let rafId = 0;

    function formationOrigin() {
      const startX = width / 2 - (config.cols * config.cellWidth) / 2;
      const startY = variant === "strip" ? (height - rows * config.cellHeight) / 2 : 26;
      return { startX, startY };
    }

    function shipX(time: number) {
      return width / 2 + Math.sin(time / 2400) * (width * config.driftFactor);
    }

    function shipY() {
      return variant === "strip" ? height - 14 : height - 34;
    }

    function spawnFallingBatch(fall: FallConfig) {
      const count = randomInt(fall.batchRange[0], fall.batchRange[1]);
      const margin = fall.hitRadiusX;
      for (let i = 0; i < count; i++) {
        fallingInvaders.push({
          x: randomBetween(margin, Math.max(margin, width - margin)),
          y: -randomBetween(0, 40),
          vy: randomBetween(fall.speedRange[0], fall.speedRange[1]),
          char: pickFrom(INVADER_GLYPHS),
          hitUntil: 0,
          dying: false,
          removeAt: 0,
        });
      }
    }

    function drawFrame(time: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      if (!config.seamless) {
        ctx.fillStyle = colors.panelBg;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.fillStyle = colors.star;
      for (const star of stars) {
        ctx.fillRect(star.x * width, star.y * height, star.r, star.r);
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${config.invaderFontPx}px ${pixelFont.style.fontFamily}, monospace`;

      if (isFalling) {
        for (const invader of fallingInvaders) {
          ctx.fillStyle = time < invader.hitUntil ? colors.invaderHit : colors.invader;
          ctx.fillText(invader.char, invader.x, invader.y);
        }
      } else {
        const { startX, startY } = formationOrigin();
        for (const invader of gridInvaders) {
          if (!invader.alive) continue;
          const x = startX + invader.col * config.cellWidth;
          const y = startY + invader.row * config.cellHeight;
          ctx.fillStyle = time < invader.hitUntil ? colors.invaderHit : colors.invader;
          ctx.fillText(invader.char, x, y);
        }
      }

      const sx = shipX(time);
      const sy = shipY();
      drawPixelGrid(
        ctx,
        SHIP,
        sx - (pixelGridWidth(SHIP) * config.shipPixelSize) / 2,
        sy,
        config.shipPixelSize,
        colors.ship,
      );

      ctx.font = `${config.bulletFontPx}px ${pixelFont.style.fontFamily}, monospace`;
      ctx.fillStyle = colors.bullet;
      for (const bullet of bullets) {
        ctx.fillText(bullet.char, bullet.x, bullet.y);
      }
    }

    function stepFalling(time: number, dt: number, fall: FallConfig) {
      if (time > nextSpawnAt) {
        const [min, max] = fall.spawnIntervalMs;
        nextSpawnAt = time + randomBetween(min, max);
        spawnFallingBatch(fall);
      }

      fallingInvaders = fallingInvaders.filter((invader) => {
        if (invader.dying) return time <= invader.removeAt;
        invader.vy += fall.gravity * dt;
        invader.y += invader.vy * dt;
        return invader.y < height + 30;
      });

      bullets = bullets.filter((bullet) => {
        bullet.y -= bullet.vy * dt;
        if (bullet.y < -10) return false;
        const target = fallingInvaders.find(
          (inv) =>
            !inv.dying &&
            Math.abs(inv.x - bullet.x) < fall.hitRadiusX &&
            Math.abs(inv.y - bullet.y) < fall.hitRadiusY,
        );
        if (target) {
          target.dying = true;
          target.hitUntil = time + 120;
          target.removeAt = time + 120;
          return false;
        }
        return true;
      });
    }

    function stepGrid(time: number, dt: number) {
      const { startX, startY } = formationOrigin();
      bullets = bullets.filter((bullet) => {
        bullet.y -= bullet.vy * dt;
        if (bullet.y < startY - 4) return false;

        const relativeCol = Math.round((bullet.x - startX) / config.cellWidth);
        if (relativeCol >= 0 && relativeCol < config.cols) {
          const target = gridInvaders.find(
            (inv) => inv.alive && inv.col === relativeCol && bullet.y <= startY + inv.row * config.cellHeight + config.cellHeight,
          );
          if (target) {
            target.hitUntil = time + 90;
            target.alive = false;
            target.respawnAt = time + randomBetween(1200, 2600);
            return false;
          }
        }
        return true;
      });

      for (const invader of gridInvaders) {
        if (!invader.alive && invader.respawnAt && time > invader.respawnAt) {
          invader.alive = true;
          invader.char = pickFrom(INVADER_GLYPHS);
          invader.respawnAt = 0;
        }
      }
    }

    function step(time: number) {
      if (elapsed === 0) elapsed = time;
      // Clamp dt so a backgrounded/throttled tab (alt-tab, minimized, OS sleep) can't
      // deliver one huge frame that teleports invaders past their removal bounds.
      const dt = Math.min(time - elapsed, 50);
      elapsed = time;

      if (time > nextBulletAt) {
        const [min, max] = config.bulletIntervalMs;
        nextBulletAt = time + randomBetween(min, max);
        bullets.push({ x: shipX(time), y: shipY(), char: pickFrom(OPERATORS), vy: config.bulletSpeed });
      }

      if (isFalling && config.fall) {
        stepFalling(time, dt, config.fall);
      } else {
        stepGrid(time, dt);
      }

      drawFrame(time);
      rafId = requestAnimationFrame(step);
    }

    measure();
    if (isFalling) {
      fallingInvaders = [];
    } else {
      buildGridInvaders();
    }
    resize();

    if (prefersReducedMotion) {
      // Falling invaders start blank; a static reduced-motion frame simply shows the empty scene + ship.
      drawFrame(0);
    } else {
      rafId = requestAnimationFrame(step);
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) drawFrame(0);
    });
    resizeObserver.observe(container);

    let themeObserver: MutationObserver | null = null;
    let mediaQuery: MediaQueryList | null = null;
    const refreshColors = () => {
      colors = readThemeColors();
      if (prefersReducedMotion) drawFrame(0);
    };
    if (config.seamless) {
      themeObserver = new MutationObserver(refreshColors);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", refreshColors);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      themeObserver?.disconnect();
      mediaQuery?.removeEventListener("change", refreshColors);
    };
  }, [variant, prefersReducedMotion]);

  const config = CONFIG[variant];

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`${pixelFont.className} ${config.heightPx === null ? "h-full" : ""}`}
      style={{ width: "100%", height: config.heightPx ?? undefined }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
