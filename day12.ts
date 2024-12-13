import { BoxDir, Point, PointSet, Rect } from './lib/rect.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = string[][];

function flood(
  r: Rect,
  val: string,
  p: Point,
  visited: PointSet,
  found: PointSet,
): number {
  if (visited.has(p)) {
    return 0;
  }
  visited.add(p);
  found.add(p);
  let count = 4;
  for (const q of p.cardinal(r)) {
    if (r.get(q) === val) {
      count--; // Once from each side
      count += flood(r, val, q, visited, found);
    }
  }
  return count;
}

function part1(inp: Parsed): number {
  const r = new Rect(inp);
  const visited = new PointSet();
  let tot = 0;
  r.forEach((v, x, y) => {
    const found = new PointSet();
    const p = new Point(x, y);
    const perim = flood(r, v, p, visited, found);
    if (found.size > 0) {
      tot += found.size * perim;
    }
  });
  return tot;
}

function sides(found: PointSet): number {
  // Number of sides = number of corners

  // This code could be compressed and sped up by creating a table with 256
  // entries. Left as an exercise.

  let tot = 0;
  for (const p of found) {
    const box = p.boxSet(found);
    if (!box.has(BoxDir.N) && !box.has(BoxDir.W)) {
      // ..  X.
      // .X  .X
      tot++;
    } else if (!box.has(BoxDir.NW) && box.has(BoxDir.N) && box.has(BoxDir.W)) {
      // .X
      // XX
      tot++;
    }

    if (!box.has(BoxDir.N) && !box.has(BoxDir.E)) {
      // ..  .X
      // X.  X.
      tot++;
    } else if (!box.has(BoxDir.NE) && box.has(BoxDir.N) && box.has(BoxDir.E)) {
      // X.
      // XX
      tot++;
    }

    if (!box.has(BoxDir.S) && !box.has(BoxDir.E)) {
      // X.  X.
      // ..  .X
      tot++;
    } else if (!box.has(BoxDir.SE) && box.has(BoxDir.S) && box.has(BoxDir.E)) {
      // XX
      // X.
      tot++;
    }

    if (!box.has(BoxDir.S) && !box.has(BoxDir.W)) {
      // .X  .X
      // ..  X.
      tot++;
    } else if (!box.has(BoxDir.SW) && box.has(BoxDir.S) && box.has(BoxDir.W)) {
      // XX
      // .X
      tot++;
    }
  }

  return tot;
}

function part2(inp: Parsed): number {
  const r = new Rect(inp);
  const visited = new PointSet();
  let tot = 0;
  r.forEach((v, x, y) => {
    const found = new PointSet();
    const p = new Point(x, y);
    flood(r, v, p, visited, found);
    if (found.size > 0) {
      tot += found.size * sides(found);
    }
  });
  return tot;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
