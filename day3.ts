import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = (boolean | number[])[];

function part1(inp: Parsed): number {
  return inp
    .filter((i) => Array.isArray(i))
    .reduce((t, [l, r]) => t + (l * r), 0);
}

function part2(inp: Parsed): number {
  let on = true;
  return inp.reduce((t, v) => {
    if (typeof v === 'boolean') {
      on = v;
    } else if (on) {
      t += v[0] * v[1];
    }
    return t;
  }, 0);
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
