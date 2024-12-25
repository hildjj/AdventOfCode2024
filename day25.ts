import { type MainArgs, parseFile } from './lib/utils.ts';

interface KeyLock {
  type: 'key' | 'lock';
  rows: string[][];
  h: number[];
}
type Parsed = KeyLock[];

function fits(key: number[], lock: number[]): boolean {
  for (let i = 0; i < 5; i++) {
    if (key[i] + lock[i] > 5) {
      return false;
    }
  }
  return true;
}

function part1(inp: Parsed): number {
  for (const i of inp) {
    for (let col = 0; col < 5; col++) {
      let tot = 0;
      for (let row = 0; row < i.rows.length; row++) {
        if (i.rows[row][col] === '#') {
          tot++;
        }
      }
      i.h.push(tot);
    }
  }
  let count = 0;
  for (const key of inp.filter(({ type }) => type === 'key')) {
    for (const lock of inp.filter(({ type }) => type === 'lock')) {
      if (fits(key.h, lock.h)) {
        count++;
      }
    }
  }
  return count;
}

export default async function main(args: MainArgs): Promise<[number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp)];
}
