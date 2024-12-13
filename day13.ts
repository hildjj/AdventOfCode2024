import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = number[][][];

function cranmer(coeff: number[]): number {
  const [x0, y0, c0, x1, y1, c1] = coeff;
  // Cranmer's rule
  const D = x0 * y1 - y0 * x1;
  const Dx = c0 * y1 - y0 * c1;
  const Dy = x0 * c1 - c0 * x1;
  if ((Dx % D) || (Dy % D)) {
    return 0;
  }
  const x = Dx / D;
  const y = Dy / D;
  return (3 * x) + y;
}

function part1(inp: Parsed): number {
  return inp.reduce(
    (t, [[x0, x1], [y0, y1], [c0, c1]]) =>
      t + cranmer([x0, y0, c0, x1, y1, c1]),
    0,
  );
}

function part2(inp: Parsed): number {
  return inp.reduce(
    (t, [[x0, x1], [y0, y1], [c0, c1]]) =>
      t + cranmer([x0, y0, c0 + 10000000000000, x1, y1, c1 + 10000000000000]),
    0,
  );
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
