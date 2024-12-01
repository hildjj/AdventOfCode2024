import { type MainArgs, parseFile } from './lib/utils.ts';
import {Counter} from './lib/counter.ts';

function part1(left: number[], right: number[]): number {
  left.sort();
  right.sort();
  return left.reduce((t, v, i) => t + Math.abs(v - right[i]), 0);
}

function part2(left: number[], right: number[]): number {
  const count = new Counter<number>();
  count.addAll(right);
  return left.reduce((t, v) => t + (v * count.get(v)), 0);
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<[number, number][]>(args);
  const left: number[] = [];
  const right: number[] = []
  for (const [l, r] of inp) {
    left.push(l);
    right.push(r);
  }
  return [part1(left, right), part2(left, right)];
}
