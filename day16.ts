import { assert } from '@std/assert/assert';
import { AllDirs, Dir, Point, Rect } from './lib/rect.ts';
import { type MainArgs, mod, parseFile } from './lib/utils.ts';
import { BinaryHeap } from '@std/data-structures';
import { PointSet } from './lib/rect.ts';

type Parsed = string[][];

// Janky Djykstra without looking up the algorithm.  Clean this up later
// and try astar, since we've got a good heuristic (manhattan distance to E).
function part1(inp: Parsed): number {
  const r = new Rect(inp);
  const start = r.indexOf('S');
  assert(start);
  const end = r.indexOf('E');
  assert(end);

  interface PointNode {
    id: string;
    pos: Point;
    dir: Dir;
    cost: number;
  }

  const backlog = new BinaryHeap<PointNode>(
    (a, b) => a.cost - b.cost,
  );
  backlog.push({
    id: `${start}-${Dir.E}`,
    pos: start,
    dir: Dir.E,
    cost: 0,
  });
  const seen = new Set<string>();

  while (!backlog.isEmpty()) {
    const n = backlog.pop();
    assert(n);
    const { id, pos, dir, cost } = n;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    if (pos.equals(end)) {
      return cost;
    }

    const f = pos.inDir(dir);
    if (r.check(f) && r.get(f) !== '#') {
      backlog.push({
        id: `${f}-${dir}`,
        pos: f,
        dir,
        cost: cost + 1,
      });
    }
    const leftDir = mod(dir - 1, 4);
    const left = pos.inDir(leftDir);
    if (r.check(left) && r.get(left) !== '#') {
      backlog.push({
        id: `${left}-${leftDir}`,
        pos: left,
        dir: leftDir,
        cost: cost + 1001,
      });
    }
    const rightDir = mod(dir + 1, 4);
    const right = pos.inDir(rightDir);
    if (r.check(right) && r.get(right) !== '#') {
      backlog.push({
        id: `${right}-${rightDir}`,
        pos: right,
        dir: rightDir,
        cost: cost + 1001,
      });
    }
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
