import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = number[];

function mapAdd(m: Map<number, number>, k: number, v = 1): void {
  const se = m.get(k);
  m.set(k, (se ?? 0) + v);
}

function blink(inp: Parsed, num: number): number {
  // Each stone k occurs v times.  On a new iteration, there are a multiple
  // ways that a given numbered stone might be created.  Add all of those ways.
  // However, no matter how a stone got created, it will have the same set of
  // descendants.
  let prev = new Map<number, number>();
  for (const s of inp) {
    mapAdd(prev, s);
  }
  for (let i = 0; i < num; i++) {
    const next = new Map<number, number>();
    for (const [k, v] of prev) {
      if (k === 0) {
        mapAdd(next, 1, v);
      } else {
        const ks = String(k);
        if (ks.length % 2 === 0) {
          const kl = ks.length / 2;
          mapAdd(next, Number(ks.slice(0, kl)), v);
          mapAdd(next, Number(ks.slice(kl)), v);
        } else {
          mapAdd(next, k * 2024, v);
        }
      }
    }
    prev = next;
  }
  let count = 0;
  for (const [_k, v] of prev) {
    count += v;
  }
  return count;
}

function part1(inp: Parsed): number {
  return blink(inp, 25);
}

function part2(inp: Parsed): number {
  return blink(inp, 75);
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
