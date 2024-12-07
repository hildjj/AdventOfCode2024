import { type MainArgs, parseFile } from './lib/utils.ts';

type Line = [number, number[]];
type Parsed = Line[];

// Starting from the front of the reversed list (the endq), see if we can rule
// out any of the operations
function calc(left: number, operands: number[], concat = false): boolean {
  if (!operands.length) {
    return left === 0;
  }
  const [first, ...rest] = operands;
  if (concat) { // Part 2 adds concatenation operator
    const sleft = String(left);
    const sfirst = String(first);
    const prefix = sleft.slice(0, -sfirst.length)
    if ((prefix + sfirst === sleft) && calc(Number(prefix), rest, concat)) {
      return true;
    }
  }

  const dleft = left / first;
  if (Number.isInteger(dleft) && calc(dleft, rest, concat)) {
    return true;
  }

  const mleft = left - first;
  return (mleft >= 0) && calc(mleft, rest, concat);
}

function part1(inp: Parsed): number {
  return inp.reduce(
    (t, [tot, operands]) => t + (calc(tot, operands) ? tot : 0),
    0
  );
}

function part2(inp: Parsed): number {
  return inp.reduce(
    (t, [tot, operands]) => t + (calc(tot, operands, true) ? tot : 0),
    0
  );
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  for (const [_tot, operands] of inp) {
    operands.reverse();
  }
  return [part1(inp), part2(inp)];
}
