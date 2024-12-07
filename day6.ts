import { Dir, Point, Rect } from './lib/rect.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = string[][];

function path(r: Rect): [Set<number>, Point] {
  const [start] = r.filter((val) => val === '^');
  let pos = start;
  let dir = Dir.N;
  const visited = new Set<number>();
  while (true) {
    visited.add(pos.toNumber());
    const ahead = pos.inDir(dir);
    if (!r.check(ahead)) {
      break;
    }
    const char = r.get(ahead);
    if (char === '.' || char === '^') {
      pos = ahead;
    } else {
      dir = (dir + 1) % 4;
    }
  }
  return [visited, start];
}

function path2(r: Rect): boolean {
  const [start] = r.filter((val) => val === '^');
  let pos = start;
  let dir = Dir.N;
  const visitedWithDir = new Set<string>();
  while (true) {
    const pwd = `${pos},${dir}`;
    if (visitedWithDir.has(pwd)) {
      return true;
    }
    visitedWithDir.add(pwd);
    const ahead = pos.inDir(dir);
    if (!r.check(ahead)) {
      return false;
    }
    const char = r.get(ahead);
    if (char === '.' || char === '^') {
      pos = ahead;
    } else {
      dir = (dir + 1) % 4;
    }
  }
}

function part1(inp: Parsed): number {
  const r = new Rect(inp);
  const [visited] = path(r);
  return visited.size;
}

function part2(inp: Parsed): number {
  const r = new Rect(inp);
  const [visited, start] = path(r);
  const points = [...visited].map((v) => Point.fromNumber(v));
  let tot = 0;
  for (const p of points) {
    if (p.equals(start)) {
      continue;
    }
    r.set(p, '#');
    if (path2(r)) {
      tot++;
    }
    r.set(p, '.');
  }
  return tot;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
