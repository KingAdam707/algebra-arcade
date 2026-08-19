"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { INVADER_A, INVADER_B, SHIP, drawPixelGrid, pixelGridWidth, type PixelGrid } from "./pixel-sprites";
import { pixelFont } from "./pixel-font";

const SYMBOLS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "x", "y", "z", "a", "+", "-", "×", "÷"];

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
  pixelSize: number;
  bulletIntervalMs: [number, number];
  bulletFontPx: number;
  starCount: number;
};

const CONFIG: Record<Variant, VariantConfig> = {
  hero: { cols: 6, rows: 3, heightPx: 260, pixelSize: 3, bulletIntervalMs: [450, 850], bulletFontPx: 13, starCount: 40 },
  strip: { cols: 7, rows: 1, heightPx: 34, pixelSize: 1.5, bulletIntervalMs: [900, 1700], bulletFontPx: 8, starCount: 14 },
};

type Bullet = { x: number; y: number; char: string; vy: number };
type Invader = { col: number; row: number; alive: boolean; hitUntil: number; respawnAt: number };
type Star = { x: number; y: number; r: number };

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickSymbol(): string {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

/**
 * Decorative 8-bit arcade scene: a ship fires algebra symbols upward at a
 * gently drifting formation of pixel invaders. Purely atmospheric branding
 * for "Algebra Arcade" — no game state, no interaction, always aria-hidden.
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
    const invaderSprites: PixelGrid[] = [INVADER_A, INVADER_B];
    const invaderCellWidth = pixelGridWidth(INVADER_A) * config.pixelSize * 1.8;
    const invaderCellHeight = INVADER_A.length * config.pixelSize * 1.6;

    let width = 0;
    const height = config.heightPx;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const invaders: Invader[] = [];
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        invaders.push({ col, row, alive: true, hitUntil: 0, respawnAt: 0 });
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
      const startX = width / 2 - (config.cols * invaderCellWidth) / 2 + drift;
      const startY = variant === "hero" ? 20 : (height - config.rows * invaderCellHeight) / 2;
      return { startX, startY };
    }

    function shipX(time: number) {
      return width / 2 + Math.sin(time / 2400) * (width * 0.18);
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

      const { startX, startY } = formationOrigin(time);
      for (const invader of invaders) {
        const x = startX + invader.col * invaderCellWidth;
        const y = startY + invader.row * invaderCellHeight;
        if (!invader.alive) continue;
        const sprite = invaderSprites[(invader.col + invader.row) % invaderSprites.length];
        const color = time < invader.hitUntil ? COLORS.invaderHit : COLORS.invader;
        drawPixelGrid(ctx, sprite, x, y, config.pixelSize, color);
      }

      const sx = shipX(time);
      const sy = variant === "hero" ? height - 34 : height - INVADER_A.length * config.pixelSize * 1.6;
      drawPixelGrid(ctx, SHIP, sx - (pixelGridWidth(SHIP) * config.pixelSize) / 2, sy, config.pixelSize, COLORS.ship);

      ctx.font = `${config.bulletFontPx}px ${pixelFont.style.fontFamily}, monospace`;
      ctx.fillStyle = COLORS.bullet;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const bullet of bullets) {
        ctx.fillText(bullet.char, bullet.x, bullet.y);
      }

      return { sx, sy };
    }

    function step(time: number) {
      if (elapsed === 0) elapsed = time;
      const dt = time - elapsed;
      elapsed = time;

      if (time > nextBulletAt) {
        const [min, max] = config.bulletIntervalMs;
        nextBulletAt = time + randomBetween(min, max);
        const sx = shipX(time);
        const sy = variant === "hero" ? height - 34 : height - INVADER_A.length * config.pixelSize * 1.6;
        bullets.push({ x: sx, y: sy, char: pickSymbol(), vy: variant === "hero" ? 0.09 : 0.06 });
      }

      const { startX, startY } = formationOrigin(time);
      bullets = bullets.filter((bullet) => {
        bullet.y -= bullet.vy * dt;
        if (bullet.y < startY - 4) return false;

        const relativeCol = Math.round((bullet.x - startX) / invaderCellWidth);
        if (relativeCol >= 0 && relativeCol < config.cols) {
          const target = invaders.find(
            (inv) => inv.alive && inv.col === relativeCol && bullet.y <= startY + inv.row * invaderCellHeight + invaderCellHeight,
          );
          if (target && bullet.y <= startY + target.row * invaderCellHeight + invaderCellHeight) {
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
