import { PointSet } from './lib/rect.ts';
import { AllDirs, Point, PointMap, Rect } from './lib/rect.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';
import { BinaryHeap } from '@std/data-structures';

type Parsed = string[][];

function astar(r: Rect, start: Point, end: Point): PointSet {
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
      const ps = new PointSet();
      let n: Point | undefined = end;
      while (n) {
        ps.add(n);
        n = prev.get(n);
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
  const r = new Rect(inp);
  const [start] = r.filter((v) => v === 'S');
  const [end] = r.filter((v) => v === 'E');

  const ps = astar(r, start, end);
  const pss = ps.size;
  const target = pss - 100;
  let tot = 0;
  let pcount = 0;
  for (const p of ps) {
    let qcount = 0;
    for (const q of ps) {
      if (p.equals(q)) {
        continue;
      }
      const d = p.manhattan(q);
      if (d === 2) {
        if ((pcount + (pss - qcount) + 1) <= target) {
          tot++;
        }
      }
      qcount++;
    }
    pcount++;
  }
  return tot;
}

function part2(inp: Parsed): number {
  const r = new Rect(inp);
  const [start] = r.filter((v) => v === 'S');
  const [end] = r.filter((v) => v === 'E');

  const ps = astar(r, start, end);
  const pss = ps.size;
  const target = pss - 100;
  let tot = 0;
  let pcount = 0;
  for (const p of ps) {
    let qcount = 0;
    for (const q of ps) {
      if (p.equals(q)) {
        continue;
      }
      const d = p.manhattan(q);
      if (d <= 20) {
        if ((pcount + (pss - qcount) + d - 1) <= target) {
          tot++;
        }
      }
      qcount++;
    }
    pcount++;
  }
  return tot;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
