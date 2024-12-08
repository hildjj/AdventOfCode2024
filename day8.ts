import { Point, PointSet, Rect } from './lib/rect.ts';
import { Sequence } from './lib/sequence.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = string[][];

class Field extends Rect {
  antennae = new Map<string, Point[]>();
  nodes = new PointSet();

  constructor(inp: Parsed, self = false) {
    super(inp);
    this.forEach((v, x, y) => {
      if (v === '.') {
        return;
      }
      let m = this.antennae.get(v);
      if (!m) {
        m = [];
        this.antennae.set(v, m);
      }
      const p = new Point(x, y);
      m.push(p);
      if (self) {
        this.nodes.add(p);
      }
    });
  }

  push(p: Point): boolean {
    if (this.check(p)) {
      this.nodes.add(p);
      return true;
    }
    return false;
  }

  get count(): number {
    return this.nodes.size;
  }
}

function part1(inp: Parsed): number {
  const r = new Field(inp);

  for (const [_k, v] of r.antennae) {
    for (const [a, b] of new Sequence(v).combinations(2)) {
      const [dx, dy] = a.delta(b);
      r.push(a.xlate(dx, dy));
      r.push(b.xlate(-dx, -dy));
    }
  }

  return r.count;
}

function part2(inp: Parsed): number {
  const r = new Field(inp, true);

  for (const [_k, v] of r.antennae) {
    for (const [a, b] of new Sequence(v).combinations(2)) {
      const [dx, dy] = a.delta(b);
      let p = a;
      do {
        p = p.xlate(dx, dy);
      } while (r.push(p));
      p = b;
      do {
        p = p.xlate(-dx, -dy);
      } while (r.push(p));
    }
  }
  return r.count;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
