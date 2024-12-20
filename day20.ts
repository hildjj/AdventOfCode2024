import { AllDirs, Point, PointMap, Rect } from './lib/rect.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';
import { BinaryHeap } from '@std/data-structures';

type Parsed = string[][];

function astar(r: Rect): Point[] {
  const [start] = r.filter((v) => v === 'S');
  const [end] = r.filter((v) => v === 'E');

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
      const ps: Point[] = [];
      let n: Point | undefined = end;
      while (n) {
        ps.push(n);
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

  return [];
}

function part1(ps: Point[]): number {
  const pslen = ps.length;
  let tot = 0;

  for (let pcount = 0; pcount < pslen; pcount++) {
    const p = ps[pcount];
    for (let qcount = pcount + 2; qcount < pslen; qcount++) {
      const q = ps[qcount];
      const d = p.manhattan(q);
      if (d === 2) {
        if ((pcount + d - qcount - 1) <= -100) {
          tot++;
        }
      }
    }
  }
  return tot;
}

function part2(ps: Point[]): number {
  const pslen = ps.length;
  let tot = 0;
  for (let pcount = 0; pcount < pslen; pcount++) {
    const p = ps[pcount];
    for (let qcount = pcount + 2; qcount < pslen; qcount++) {
      const q = ps[qcount];
      const d = p.manhattan(q);
      if ((d > 1) && (d <= 20)) {
        if ((pcount + d - qcount - 1) <= -100) {
          tot++;
        }
      }
    }
  }
  return tot;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  const r = new Rect(inp);
  const ps = astar(r);

  return [part1(ps), part2(ps)];
}
