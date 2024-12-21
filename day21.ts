import { Point, Rect } from './lib/rect.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = string[];

const numPad = new Rect([
  '789',
  '456',
  '123',
  ' 0A',
].map((s) => [...s]));

const dPad = new Rect([
  ' ^A',
  '<v>',
].map((s) => [...s]));

function goVert(
  s: Point,
  e: Point,
  prev: string,
  d1: number,
  maxDepth: number,
  seen: Map<string, number>,
): [number, string] {
  let dir = prev;
  let vert = 0;
  if (s.y < e.y) {
    vert += cost(prev, 'v', dPad, d1, maxDepth, seen);
    vert += cost('v', 'v', dPad, d1, maxDepth, seen) * (e.y - s.y - 1);
    dir = 'v';
  } else if (s.y > e.y) {
    vert += cost(prev, '^', dPad, d1, maxDepth, seen);
    vert += cost('^', '^', dPad, d1, maxDepth, seen) * (s.y - e.y - 1);
    dir = '^';
  }
  return [vert, dir];
}

function goHorz(
  s: Point,
  e: Point,
  prev: string,
  d1: number,
  maxDepth: number,
  seen: Map<string, number>,
): [number, string] {
  let horz = 0;
  let dir = prev;
  if (s.x < e.x) {
    horz += cost(prev, '>', dPad, d1, maxDepth, seen);
    horz += cost('>', '>', dPad, d1, maxDepth, seen) * (e.x - s.x - 1);
    dir = '>';
  } else if (s.x > e.x) {
    horz += cost(prev, '<', dPad, d1, maxDepth, seen);
    horz += cost('<', '<', dPad, d1, maxDepth, seen) * (s.x - e.x - 1);
    dir = '<';
  }
  return [horz, dir];
}

function cost(
  start: string,
  end: string,
  pad: Rect,
  depth: number,
  maxDepth: number,
  seen: Map<string, number>,
): number {
  if (depth === maxDepth) {
    return 1;
  }

  const key = `${start},${end},${depth}`;
  const memo = seen.get(key);
  if (memo !== undefined) {
    return memo;
  }

  const s = pad.indexOf(start)!;
  const e = pad.indexOf(end)!;
  let res = Infinity;
  const d1 = depth + 1;

  // Either horizontal-first or vertical-first will give the lowest total.
  // At most one of the ways will be blocked by the bad space.

  // Horizontal-first
  if (pad.get(e.x, s.y) !== ' ') {
    const [horz1, first] = goHorz(s, e, 'A', d1, maxDepth, seen);
    const [horz2, second] = goVert(s, e, first, d1, maxDepth, seen);
    const horz = horz1 + horz2 + cost(second, 'A', dPad, d1, maxDepth, seen);
    res = Math.min(res, horz);
  }

  // Vertical-first
  if (pad.get(s.x, e.y) !== ' ') {
    const [vert1, first] = goVert(s, e, 'A', d1, maxDepth, seen);
    const [vert2, second] = goHorz(s, e, first, d1, maxDepth, seen);
    const vert = vert1 + vert2 + cost(second, 'A', dPad, d1, maxDepth, seen);
    res = Math.min(res, vert);
  }
  seen.set(key, res);
  return res;
}

function sumCost(inp: Parsed, maxDepth: number): number {
  const seen = new Map<string, number>();
  let tot = 0;
  let prev = 'A';
  for (const num of inp) {
    let b = 0;
    for (const n of num) {
      b += cost(prev, n, numPad, 0, maxDepth, seen);
      prev = n;
    }
    const i = parseInt(num);
    tot += b * i;
  }
  return tot;
}

function part1(inp: Parsed): number {
  return sumCost(inp, 3);
}

function part2(inp: Parsed): number {
  return sumCost(inp, 26);
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
