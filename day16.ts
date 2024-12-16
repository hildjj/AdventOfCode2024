import { AllDirs, Dir, Point, Rect } from './lib/rect.ts';
import { type MainArgs, mod, parseFile } from './lib/utils.ts';
import { BinaryHeap } from '@std/data-structures';
import { PointSet } from './lib/rect.ts';

type Parsed = string[][];

function toId(p: Point, d: Dir): string {
  return `${p}-${d}`;
}

interface PointNode {
  id: string;
  pos: Point;
  dir: Dir;
  gScore: number;
  fScore: number;
  prev: Set<string>;
}

interface AstarResults {
  start: Point;
  end: Point;
  minScore: number;
  points: Map<string, PointNode>;
}

function astar(inp: Parsed): AstarResults {
  const r = new Rect(inp);
  const start = r.indexOf('S')!;
  const end = r.indexOf('E')!;

  const sn: PointNode = {
    id: toId(start, Dir.E),
    pos: start,
    dir: Dir.E,
    gScore: 0,
    fScore: 0,
    prev: new Set(),
  };
  const points = new Map<string, PointNode>([[sn.id, sn]]);
  const backlog = new BinaryHeap<PointNode>(
    (a, b) => a.fScore - b.fScore,
  );
  backlog.push(sn);

  function check(pos: Point, dir: Dir, newScore: number, prevId: string): void {
    const id = toId(pos, dir);
    let node = points.get(id);
    if (!node) {
      node = {
        id: toId(pos, dir),
        pos,
        dir,
        gScore: newScore,
        fScore: newScore + pos.manhattan(end),
        prev: new Set([prevId]),
      };
      points.set(id, node);
      backlog.push(node);
    } else if (newScore < node.gScore) {
      node.gScore = newScore;
      node.fScore = newScore + pos.manhattan(end);
      node.prev = new Set([prevId]);
      backlog.push(node);
    } else if (newScore === node.gScore) {
      // Track all paths that got us to this score, for reconstruction.
      node.prev.add(prevId);
    }
  }

  let minScore = Infinity;
  while (!backlog.isEmpty()) {
    const n = backlog.pop()!;
    const { id, pos, dir, gScore } = n;

    if (pos.equals(end)) {
      minScore = Math.min(gScore, minScore);
      continue;
    }
    if (gScore > minScore) {
      continue;
    }

    const f = pos.inDir(dir);
    if (r.check(f) && r.get(f) !== '#') {
      check(f, dir, gScore + 1, id);
    }
    check(pos, mod(dir - 1, 4), gScore + 1000, id);
    check(pos, mod(dir + 1, 4), gScore + 1000, id);
  }

  return {
    start,
    end,
    minScore,
    points,
  }
}

function part1(res: AstarResults): number {
  return res.minScore;
}

function part2(res: AstarResults): number {
  const {points, end} = res;
  const seen = new PointSet();
  const reconstruct: string[] = [];
  for (const d of AllDirs) {
    const id = toId(end, d);
    if (isFinite(points.get(id)?.gScore ?? Infinity)) {
      reconstruct.push(id);
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
  const res = astar(inp);
  return [part1(res), part2(res)];
}
