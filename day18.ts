import {
  AllBoxDirs,
  AllDirs,
  Point,
  PointForest,
  PointMap,
  Rect,
} from './lib/rect.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';
import { BinaryHeap } from '@std/data-structures';

type Parsed = [x: number, y: number][];

const SIZE = 71;
const NUM = 1024;

function astar(r: Rect): number {
  const start = new Point(0, 0);
  const end = new Point(r.width - 1, r.height - 1);

  const gScore = new PointMap([[start, 0]]);
  const fScore = new PointMap([[start, 0]]);
  const backlog = new BinaryHeap<Point>(
    (a, b) => fScore.get(a)! - fScore.get(b)!,
  );
  backlog.push(start);

  while (!backlog.isEmpty()) {
    const p = backlog.pop()!;
    const g = gScore.get(p)!;

    if (p.equals(end)) {
      return g;
    }

    for (const d of AllDirs) {
      const next = p.inDir(d);
      if (r.check(next) && (r.get(next) !== '#')) {
        const nextG = gScore.get(next) ?? Infinity;
        if (g + 1 < nextG) {
          gScore.set(next, g + 1);
          fScore.set(next, g + next.manhattan(end));
          backlog.push(next);
        }
      }
    }
  }

  return NaN;
}

function part1(inp: Parsed): number {
  const rect = Rect.ofSize(SIZE, SIZE, '.');
  for (let i = 0; i < NUM; i++) {
    rect.set(...inp[i], '#');
  }

  return astar(rect);
}

function part2(inp: Parsed): [number, number] {
  // See: https://en.wikipedia.org/wiki/Disjoint-set_data_structure
  // If there is a set of dropped points that crosses between top-left and
  // bottom-right (including diagonals), then there is no path between those
  // points.  If there is a a set that goes from left to bottom or top to
  // right, it will still allow a path.
  const max = SIZE - 1;
  const pf = new PointForest();
  for (const [x, y] of inp) {
    const p = new Point(x, y);
    const data = (x === 0x0 ? 0b0001 : 0) | // Left
      (x === max ? 0b0010 : 0) | // Right
      (y === 0x0 ? 0b0100 : 0) | // Top
      (y === max ? 0b1000 : 0); // Bottom
    pf.add(p, data);
    for (const d of AllBoxDirs) {
      const neighbor = p.inBoxDir(d)!;
      const un = pf.union(p, neighbor);
      switch (un) {
        case undefined:
          // Neighbor not in set
          break;
        case 0b0011: // Touches left and right
        case 0b0101: // Touches top and left
        case 0b0111:
        case 0b1010: // Touches bottom and right
        case 0b1011:
        case 0b1100: // Touches top and bottom
        case 0b1101:
        case 0b1110:
        case 0b1111:
          return [x, y];
      }
    }
  }
  return [NaN, NaN];
}

export default async function main(
  args: MainArgs,
): Promise<[number, [number, number]]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
