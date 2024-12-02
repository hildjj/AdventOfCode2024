import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = number[][];

function isSafe(levels: number[]): boolean {
  if (levels.length < 2) {
    return true;
  }
  let prev = levels[0];
  const dir = Math.sign(prev - levels[1]);
  for (let i = 1; i < levels.length; i++) {
    const l = levels[i];
    const diff = prev - l;
    if ((diff === 0) || (Math.abs(diff) > 3) || (Math.sign(diff) !== dir)) {
      return false;
    }
    prev = l;
  }
  return true;
}

function part1(inp: Parsed): number {
  let count = 0;
  for (const levels of inp) {
    if (isSafe(levels)) {
      count++;
    }
  }
  return count;
}

function part2(inp: Parsed): number {
  let count = 0;
  for (const levels of inp) {
    if (isSafe(levels)) {
      count++;
    } else {
      for (let i = 0; i < levels.length; i++) {
        if (isSafe(levels.toSpliced(i, 1))) {
          count++;
          break;
        }
      }
    }
  }
  return count;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
