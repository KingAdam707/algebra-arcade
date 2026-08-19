/** Original pixel-grid sprites (not a reproduction of any specific game's artwork). '#' = filled pixel. */
export type PixelGrid = readonly string[];

export const SHIP: PixelGrid = ["....#....", "...###...", "...###...", ".#######.", "#########"];

export function pixelGridWidth(grid: PixelGrid): number {
  return Math.max(...grid.map((row) => row.length));
}

export function drawPixelGrid(
  ctx: CanvasRenderingContext2D,
  grid: PixelGrid,
  x: number,
  y: number,
  pixelSize: number,
  color: string,
) {
  ctx.fillStyle = color;
  for (let row = 0; row < grid.length; row++) {
    const line = grid[row];
    for (let col = 0; col < line.length; col++) {
      if (line[col] === "#") {
        ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}
