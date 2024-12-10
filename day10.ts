import { Point, PointSet, Rect } from './lib/rect.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = number[][];

function hike(r: Rect<number>, p: Point, next: number, peaks: PointSet): void {
  for (const n of p.cardinal(r)) {
    if (r.get(n) === next) {
      if (next === 9) {
        peaks.add(n);
      } else {
        hike(r, n, next + 1, peaks);
      }
    }
  }
}

function hike2(r: Rect<number>, p: Point, next: number): number {
  // I expected to have to memoize or work from the back to get a solution
  // that worked fast enough.
  let count = 0;
  for (const n of p.cardinal(r)) {
    if (r.get(n) === next) {
      if (next === 9) {
        count++;
      } else {
        count += hike2(r, n, next + 1);
      }
    }
  }
  return count;
}

function part1(inp: Parsed): number {
  const r = new Rect(inp);
  let tot = 0;
  for (const p of r.filter(v => v === 0)) {
    const peaks = new PointSet();
    hike(r, p, 1, peaks);
    tot += peaks.size;
  }
  return tot;
}

function part2(inp: Parsed): number {
  const r = new Rect(inp);
  let tot = 0;
  for (const p of r.filter(v => v === 0)) {
    tot += hike2(r, p, 1);
  }
  return tot;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
