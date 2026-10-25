const SIZE = 21;

function inFinder(x: number, y: number): boolean {
  if (x < 8 && y < 8) return true;
  if (x >= SIZE - 8 && y < 8) return true;
  if (x < 8 && y >= SIZE - 7) return true;
  return false;
}

function setFinder(grid: boolean[][]): void {
  const paint = (ox: number, oy: number) => {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const on =
          dx === 0 ||
          dx === 6 ||
          dy === 0 ||
          dy === 6 ||
          (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
        grid[oy + dy][ox + dx] = on;
      }
    }
  };
  paint(0, 0);
  paint(SIZE - 7, 0);
  paint(0, SIZE - 7);
}

/** Matriz decorativa determinista (no es un QR ISO válido; placeholder hasta URL por usuario). */
export function buildQrMatrix(payload: string): boolean[][] {
  const grid = Array.from({ length: SIZE }, () => Array<boolean>(SIZE).fill(false));
  setFinder(grid);
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (inFinder(x, y)) continue;
      h = Math.imul(h ^ (x + y * SIZE), 2246822519);
      grid[y][x] = (h >>> 0) % 5 !== 0;
    }
  }
  return grid;
}

export const QR_MATRIX_SIZE = SIZE;
