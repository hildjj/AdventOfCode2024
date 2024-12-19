import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = [towels: string[], designs: string[]];

// Global cache across both parts, makes part2 O(1).
const seen = new Map<string, number>();

// Memoized, count the number of ways a string can be partitioned
function find(d: string, towels: string[]): number {
  if (d === '') {
    return 1;
  }
  const s = seen.get(d);
  if (s !== undefined) {
    return s;
  }
  let count = 0;
  for (const t of towels) {
    if (d.startsWith(t)) {
      count += find(d.slice(t.length), towels);
    }
  }
  seen.set(d, count);
  return count;
}

function part1(inp: Parsed): number {
  const [towels, designs] = inp;

  let tot = 0;
  for (const d of designs) {
    if (find(d, towels) > 0) {
      tot++;
    }
  }

  return tot;
}

function part2(inp: Parsed): number {
  const [towels, designs] = inp;

  let tot = 0;
  for (const d of designs) {
    tot += find(d, towels);
  }
  return tot;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
