import { type MainArgs, parseFile } from './lib/utils.ts';
import { Counter } from './lib/counter.ts';
import { Ring } from './lib/ring.ts';

type Parsed = bigint[];

const PRUNE = 16777216n;
function nextSecret(n: bigint): bigint {
  n = ((n * 64n) ^ n) % PRUNE;
  n = ((n / 32n) ^ n) % PRUNE;
  n = ((n * 2048n) ^ n) % PRUNE;
  return n;
}

function part1(inp: Parsed): bigint {
  let tot = 0n;
  for (let n of inp) {
    for (let i = 0; i < 2000; i++) {
      n = nextSecret(n);
    }
    tot += n;
  }
  return tot;
}

function part2(inp: Parsed): number {
  const patterns = new Counter();
  for (let n of inp) {
    const c = new Ring(4);
    const seen = new Set<string>();

    for (let i = 0; i < 2000; i++) {
      const nextN = nextSecret(n);
      const cost = n % 10n;
      const nextCost = nextN % 10n;
      c.push(nextCost - cost);

      if (c.full) {
        const key = c.get().join(',');
        if (!seen.has(key)) {
          patterns.sum(Number(nextCost), key);
          seen.add(key);
        }
      }
      n = nextN;
    }
  }

  const [_maxKey, max] = patterns.max()!;
  return max;
}

export default async function main(args: MainArgs): Promise<[bigint, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
