import { AllDirs, Point, PointMap, PointSet, Rect } from './lib/rect.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';
import { BinaryHeap } from '@std/data-structures';

type Parsed = [x: number, y: number][];

const SIZE = 71;
const NUM = 1024;

function astar(r: Rect): PointSet {
  const start = new Point(0, 0);
  const end = new Point(r.width - 1, r.height - 1);

  const gScore = new PointMap([[start, 0]]);
  const fScore = new PointMap([[start, 0]]);
  const prev = new PointMap<Point>();
  const backlog = new BinaryHeap<Point>(
    (a, b) => fScore.get(a)! - fScore.get(b)!,
  );
  backlog.push(start);

  while (!backlog.isEmpty()) {
    const p = backlog.pop()!;
    const g = gScore.get(p)!;

    if (p.equals(end)) {
      const ps = new PointSet([start]);
      let pp: Point | undefined = p;
      while (pp) {
        ps.add(pp);
        pp = prev.get(pp);
      }
      return ps;
    }

    for (const d of AllDirs) {
      const next = p.inDir(d);
      if (r.check(next) && (r.get(next) !== '#')) {
        const nextG = gScore.get(next) ?? Infinity;
        if (g + 1 < nextG) {
          gScore.set(next, g + 1);
          fScore.set(next, g + next.manhattan(end));
          backlog.push(next);
          prev.set(next, p);
        }
      }
    }
  }

  return new PointSet();
}

function part1(inp: Parsed): number {
  const rect = Rect.ofSize(SIZE, SIZE, '.');
  for (let i = 0; i < NUM; i++) {
    rect.set(...inp[i], '#');
  }

  return astar(rect).size - 1; // Fencepost
}

function part2(inp: Parsed): [number, number] {
  const rect = Rect.ofSize(SIZE, SIZE, '.');
  // We checked the first NUM in part 1
  for (let i = 0; i < NUM; i++) {
    rect.set(...inp[i], '#');
  }

  // Only check if the point hits our existing path.
  // Force the first one to match so we get one good path at the beginning.
  let path = new PointSet([new Point(...inp[NUM])]);
  for (let i = NUM; i < inp.length; i++) {
    const p = new Point(...inp[i]);
    rect.set(p, '#');
    if (path.has(p)) {
      path = astar(rect);
      if (path.size === 0) {
        return inp[i];
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
