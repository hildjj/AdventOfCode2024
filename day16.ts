import { AllDirs, Dir, Point, Rect } from './lib/rect.ts';
import { type MainArgs, mod, parseFile } from './lib/utils.ts';
import { BinaryHeap } from '@std/data-structures';
import { PointSet } from './lib/rect.ts';

type Parsed = string[][];

function part1(inp: Parsed): number {
  const r = new Rect(inp);
  const start = r.indexOf('S')!;
  const end = r.indexOf('E')!;

  function toId(p: Point, d: Dir): string {
    return `${p}-${d}`;
  }

  interface PointNode {
    pos: Point;
    dir: Dir;
    gScore: number;
    fScore: number;
  }

  const sn: PointNode = {
    pos: start,
    dir: Dir.E,
    gScore: 0,
    fScore: 0,
  };
  const points = new Map<string, PointNode>([[toId(start, Dir.E), sn]]);
  const backlog = new BinaryHeap<PointNode>(
    (a, b) => a.fScore - b.fScore,
  );
  backlog.push(sn);

  function check(pos: Point, dir: Dir, newScore: number): void {
    const id = toId(pos, dir);
    let fn = points.get(id);
    if (!fn) {
      fn = {
        pos,
        dir,
        gScore: newScore,
        fScore: newScore + pos.manhattan(end),
      }
      points.set(id, fn);
      backlog.push(fn);
    } else if (newScore < fn.gScore) {
      fn.gScore = newScore;
      fn.fScore = newScore + pos.manhattan(end);
      backlog.push(fn);
    }
  }

  while (!backlog.isEmpty()) {
    const n = backlog.pop()!;
    const { pos, dir, gScore } = n;

    if (pos.equals(end)) {
      return gScore;
    }

    const f = pos.inDir(dir);
    if (r.check(f) && r.get(f) !== '#') {
      check(f, dir, gScore + 1);
    }
    check(pos, mod(dir - 1, 4), gScore + 1000);
    check(pos, mod(dir + 1, 4), gScore + 1000);
  }

  return NaN;
}

function part2(inp: Parsed): number {
  const r = new Rect(inp);
  const start = r.indexOf('S')!;
  const end = r.indexOf('E')!;

  interface Node {
    pos: Point;
    cost: number;
    prev: Set<string>;
  }
  const points = new Map<string, Node>();
  points.set(`${start}-${Dir.E}`, { pos: start, cost: 0, prev: new Set() });
  for (const d of AllDirs) {
    points.set(`${end}-${d}`, { pos: end, cost: Infinity, prev: new Set() });
  }

  interface BackNode {
    dir: Dir;
    pos: Point;
  }
  const backlog = new BinaryHeap<BackNode>(
    (a, b) =>
      points.get(`${a.pos}-${a.dir}`)!.cost -
      points.get(`${b.pos}-${b.dir}`)!.cost,
  );
  backlog.push({
    dir: Dir.E,
    pos: start,
  });

  function addDir(
    prev: Point,
    prevDir: Dir,
    pos: Point,
    dir: Dir,
    cost: number,
    newCost: number,
  ): void {
    if (r.check(pos) && r.get(pos) !== '#') {
      const id = `${pos}-${dir}`;
      const fc = points.get(id);
      if (!fc) {
        points.set(id, {
          pos,
          cost: newCost,
          prev: new Set([`${prev}-${prevDir}`]),
        });
        backlog.push({ dir, pos });
      } else {
        if (newCost < fc.cost) {
          fc.cost = cost + 1;
          fc.prev = new Set([`${prev}-${prevDir}`]);
          backlog.push({
            dir,
            pos: pos,
          });
        } else if (newCost === fc.cost) {
          fc.prev.add(`${prev}-${prevDir}`);
          backlog.push({ dir, pos });
        }
      }
    }
  }

  while (!backlog.isEmpty()) {
    const n = backlog.pop()!;
    const { pos, dir } = n;
    const { cost } = points.get(`${pos}-${dir}`)!;

    addDir(pos, dir, pos.inDir(dir), dir, cost, cost + 1);
    addDir(pos, dir, pos, mod(dir - 1, 4), cost, cost + 1000);
    addDir(pos, dir, pos, mod(dir + 1, 4), cost, cost + 1000);
  }

  const seen = new PointSet();
  const reconstruct: string[] = [];
  for (const d of AllDirs) {
    if (isFinite(points.get(`${end}-${d}`)!.cost)) {
      reconstruct.push(`${end}-${d}`);
    }
  }
  while (reconstruct.length) {
    const id = reconstruct.shift()!;
    const { pos, prev } = points.get(id)!;
    seen.add(pos);
    reconstruct.push(...prev);
  }
  return seen.size;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
