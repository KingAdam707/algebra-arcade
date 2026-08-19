"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { SHIP, drawPixelGrid, pixelGridWidth } from "./pixel-sprites";
import { pixelFont } from "./pixel-font";

/** The ship's ammunition: operators, hunting down the numbers and letters. */
const OPERATORS = ["+", "-", "×", "÷"];
/** The enemies: the numbers and letters an operator would act on. */
const INVADER_GLYPHS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "x", "y", "z", "a", "b", "n"];

const COLORS = {
  panelBg: "#080a14",
  invader: "#8ea2ff",
  invaderHit: "#eef0fa",
  ship: "#eef0fa",
  bullet: "#ffd76a",
  star: "#22283f",
};

type Variant = "hero" | "strip";

type VariantConfig = {
  cols: number;
  rows: number;
  heightPx: number;
  shipPixelSize: number;
  invaderFontPx: number;
  bulletFontPx: number;
  cellWidth: number;
  cellHeight: number;
  bulletIntervalMs: [number, number];
  bulletSpeed: number;
  starCount: number;
};

const CONFIG: Record<Variant, VariantConfig> = {
  hero: {
    cols: 6,
    rows: 3,
    heightPx: 260,
    shipPixelSize: 3,
    invaderFontPx: 16,
    bulletFontPx: 14,
    cellWidth: 62,
    cellHeight: 42,
    bulletIntervalMs: [450, 850],
    bulletSpeed: 0.09,
    starCount: 40,
  },
  strip: {
    cols: 7,
    rows: 1,
    heightPx: 34,
    shipPixelSize: 1.4,
    invaderFontPx: 10,
    bulletFontPx: 9,
    cellWidth: 30,
    cellHeight: 16,
    bulletIntervalMs: [900, 1700],
    bulletSpeed: 0.06,
    starCount: 14,
  },
};

type Bullet = { x: number; y: number; char: string; vy: number };
type Invader = { col: number; row: number; char: string; alive: boolean; hitUntil: number; respawnAt: number };
type Star = { x: number; y: number; r: number };

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickFrom(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Decorative 8-bit arcade scene: a ship fires operators (+ - x div) upward at
 * a gently drifting formation of number/letter invaders. Purely atmospheric
 * branding for "Algebra Arcade" — no game state, no interaction, always
 * aria-hidden.
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

    let width = 0;
    const height = config.heightPx;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const invaders: Invader[] = [];
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        invaders.push({ col, row, char: pickFrom(INVADER_GLYPHS), alive: true, hitUntil: 0, respawnAt: 0 });
      }
    }

    const stars: Star[] = Array.from({ length: config.starCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: randomBetween(0.5, 1.4),
    }));

    let bullets: Bullet[] = [];
    let nextBulletAt = 0;
    let elapsed = 0;
    let rafId = 0;

    function resize() {
      if (!canvas || !container) return;
      width = container.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (ctx) ctx.imageSmoothingEnabled = false;
    }

    function formationOrigin(time: number) {
      const drift = Math.sin(time / 1600) * (width * 0.08);
      const startX = width / 2 - (config.cols * config.cellWidth) / 2 + drift;
      const startY = variant === "hero" ? 26 : (height - config.rows * config.cellHeight) / 2;
      return { startX, startY };
    }

    function shipX(time: number) {
      return width / 2 + Math.sin(time / 2400) * (width * 0.18);
    }

    function shipY() {
      return variant === "hero" ? height - 34 : height - 14;
    }

    function drawFrame(time: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = COLORS.panelBg;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = COLORS.star;
      for (const star of stars) {
        ctx.fillRect(star.x * width, star.y * height, star.r, star.r);
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const { startX, startY } = formationOrigin(time);
      ctx.font = `${config.invaderFontPx}px ${pixelFont.style.fontFamily}, monospace`;
      for (const invader of invaders) {
        if (!invader.alive) continue;
        const x = startX + invader.col * config.cellWidth;
        const y = startY + invader.row * config.cellHeight;
        ctx.fillStyle = time < invader.hitUntil ? COLORS.invaderHit : COLORS.invader;
        ctx.fillText(invader.char, x, y);
      }

      const sx = shipX(time);
      const sy = shipY();
      drawPixelGrid(
        ctx,
        SHIP,
        sx - (pixelGridWidth(SHIP) * config.shipPixelSize) / 2,
        sy,
        config.shipPixelSize,
        COLORS.ship,
      );

      ctx.font = `${config.bulletFontPx}px ${pixelFont.style.fontFamily}, monospace`;
      ctx.fillStyle = COLORS.bullet;
      for (const bullet of bullets) {
        ctx.fillText(bullet.char, bullet.x, bullet.y);
      }
    }

    function step(time: number) {
      if (elapsed === 0) elapsed = time;
      const dt = time - elapsed;
      elapsed = time;

      if (time > nextBulletAt) {
        const [min, max] = config.bulletIntervalMs;
        nextBulletAt = time + randomBetween(min, max);
        bullets.push({ x: shipX(time), y: shipY(), char: pickFrom(OPERATORS), vy: config.bulletSpeed });
      }

      const { startX, startY } = formationOrigin(time);
      bullets = bullets.filter((bullet) => {
        bullet.y -= bullet.vy * dt;
        if (bullet.y < startY - 4) return false;

        const relativeCol = Math.round((bullet.x - startX) / config.cellWidth);
        if (relativeCol >= 0 && relativeCol < config.cols) {
          const target = invaders.find(
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

      for (const invader of invaders) {
        if (!invader.alive && invader.respawnAt && time > invader.respawnAt) {
          invader.alive = true;
          invader.char = pickFrom(INVADER_GLYPHS);
          invader.respawnAt = 0;
        }
      }

      drawFrame(time);
      rafId = requestAnimationFrame(step);
    }

    resize();

    if (prefersReducedMotion) {
      drawFrame(0);
    } else {
      rafId = requestAnimationFrame(step);
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) drawFrame(0);
    });
    observer.observe(container);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [variant, prefersReducedMotion]);

  const config = CONFIG[variant];

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={pixelFont.className}
      style={{ width: "100%", height: config.heightPx }}
    >
      <canvas ref={canvasRef} className="block h-full w-full rounded-control" />
    </div>
  );
}
