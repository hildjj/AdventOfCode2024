import { type MainArgs, parseFile } from './lib/utils.ts';
import { NumberCounter } from './lib/counter.ts';

type Parsed = bigint[];

// Has to be bigints, since we go over 2^32.
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
  const patterns = new NumberCounter();
  for (let n of inp) {
    let last4 = 0;
    const seen = new Set<number>();
    let cost = Number(n % 10n);

    for (let i = 0; i < 2000; i++) {
      const nextN = nextSecret(n);
      const nextCost = Number(nextN % 10n);
      // Input is -9..9.  Normalize to 0..18, which takes 5 bits.
      // Put the newest one at the top chunk, moving all of the others towards 0.
      last4 = ((nextCost - cost + 9) << 15) | (last4 >> 5);

      if ((i > 2) && !seen.has(last4)) {
        patterns.sum(nextCost, last4);
        seen.add(last4);
      }
      n = nextN;
      cost = nextCost;
    }
  }

  const [_maxKey, max] = patterns.max()!;
  return max;
}

export default async function main(args: MainArgs): Promise<[bigint, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
