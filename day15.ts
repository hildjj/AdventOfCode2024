import { type MainArgs, parseFile } from './lib/utils.ts';
import { Dir, Point, PointSet, Rect } from './lib/rect.ts';

type Parsed = [board: string[][], moves: Dir[][]];

function moveBox(r: Rect, p: Point, d: Dir): boolean {
  const n = p.inDir(d);
  const target = r.get(n);
  if (target === '#') {
    return false;
  }
  if (target === 'O') {
    if (!moveBox(r, n, d)) {
      return false;
    }
  }
  r.set(n, 'O');
  r.set(p, '.');
  return true;
}

type Move = [p: Point, val: string];

function moveBigBox(
  r: Rect,
  p: Point,
  d: Dir,
  moves: Move[],
  visited: PointSet,
): boolean {
  if (visited.has(p)) {
    return true;
  }
  visited.add(p);
  // p is one end of bigBox.
  if ((d === Dir.E) || (d === Dir.W)) {
    const skip = p.inDir(d);
    const n = skip.inDir(d);
    const target = r.get(n);
    if (target === '#') {
      return false;
    }
    if (target !== '.') {
      if (!moveBigBox(r, n, d, moves, visited)) {
        return false;
      }
    }
    moves.push([n, r.get(skip)]);
    moves.push([skip, r.get(p)]);
    moves.push([p, '.']);
    return true;
  } else {
    const pChar = r.get(p);
    const o = (pChar === '[') ? p.inDir(Dir.E) : p.inDir(Dir.W);
    if (visited.has(o)) {
      return true;
    }
    visited.add(o);
    const nP = p.inDir(d);
    const nO = o.inDir(d);
    const nPchar = r.get(nP);
    const nOchar = r.get(nO);
    if ((nPchar === '#') || (nOchar === '#')) {
      return false;
    }
    if (nPchar !== '.') {
      if (!moveBigBox(r, nP, d, moves, visited)) {
        return false;
      }
    }
    if (
      (pChar !== nPchar) && (nOchar !== '.') &&
      !moveBigBox(r, nO, d, moves, visited)
    ) {
      return false;
    }
    moves.push([nP, pChar]);
    moves.push([nO, r.get(o)]);
    moves.push([p, '.']);
    moves.push([o, '.']);

    return true;
  }
}

function part1(inp: Parsed): number {
  const r = new Rect(inp[0]).copy();
  let [pos] = r.filter((v) => v === '@');
  for (const line of inp[1]) {
    for (const d of line) {
      const next = pos.inDir(d);
      const target = r.get(next);
      // Runs into a wall
      if (target === '#') {
        // No-op
      } else if (target === 'O') {
        // Do box processing
        if (moveBox(r, next, d)) {
          r.set(pos, '.');
          r.set(next, '@');
          pos = next;
        }
      } else {
        r.set(pos, '.');
        r.set(next, '@');
        pos = next;
      }
    }
  }

  let tot = 0;
  for (const p of r.filter((v) => v === 'O')) {
    tot += p.y * 100 + p.x;
  }
  return tot;
}

function part2(inp: Parsed): number {
  // Double-wide
  const r = new Rect<string>(inp[0].map((row) =>
    row.flatMap((v) => {
      switch (v) {
        case '#':
          return ['#', '#'];
        case 'O':
          return ['[', ']'];
        case '.':
          return ['.', '.'];
        case '@':
          return ['@', '.'];
      }
      throw new Error(`Invalid cell: ${v}`);
    })
  ));
  let [pos] = r.filter((v) => v === '@');
  const moves: Move[] = [];
  const visited = new PointSet();
  for (const line of inp[1]) {
    for (const d of line) {
      const next = pos.inDir(d);
      const target = r.get(next);
      // Runs into a wall
      if (target === '#') {
        // No-op
      } else if ((target === '[') || (target === ']')) {
        moves.length = 0;
        visited.clear();
        if (moveBigBox(r, next, d, moves, visited)) {
          for (const [p, val] of moves) {
            r.set(p, val);
          }
          r.set(pos, '.');
          r.set(next, '@');
          pos = next;
        }
      } else {
        r.set(pos, '.');
        r.set(next, '@');
        pos = next;
      }
    }
  }

  let tot = 0;
  for (const p of r.filter((v) => v === '[')) {
    tot += p.y * 100 + p.x;
  }
  return tot;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
