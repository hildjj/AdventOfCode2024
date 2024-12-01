import { type MainArgs, parseFile } from './lib/utils.ts';
import { Counter } from './lib/counter.ts';
import { Sequence } from './lib/sequence.ts';

function part1(left: number[], right: number[]): number {
  left.sort();
  right.sort();
  return Sequence
    .zip(left, right)
    .reduce((t, [l, r]): number => t + Math.abs(l - r), 0);
}

function part2(left: number[], right: number[]): number {
  const count = new Counter<number>();
  count.addAll(right);
  return left.reduce((t, v) => t + (v * count.get(v)), 0);
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<[number, number][]>(args);
  const left: number[] = [];
  const right: number[] = [];
  for (const [l, r] of inp) {
    left.push(l);
    right.push(r);
  }
  return [part1(left, right), part2(left, right)];
}
