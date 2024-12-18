import { AllDirs, Point, PointMap, Rect } from './lib/rect.ts';
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
  const rect = Rect.ofSize(SIZE, SIZE, '.');
  // 2.5 found empirically to just reduce run time.
  for (let i = 0; i < 2.5 * NUM; i++) {
    rect.set(...inp[i], '#');
  }
  for (let i = 2.5 * NUM; i < inp.length; i++) {
    rect.set(...inp[i], '#');
    if (isNaN(astar(rect))) {
      return inp[i];
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
