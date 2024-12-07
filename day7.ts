import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = [number, number[]][];

// Starting from the front of the reversed list (the endq), see if we can rule
// out any of the operations
function calc(left: number, operands: number[], concat = false): number {
  if ((left <= 0) || (Math.floor(left) !== left) || !operands.length) {
    return left;
  }
  const [first, ...rest] = operands;
  if (concat) { // Part 2
    // This is most likely to rule out an operand.
    // 20 || 123 = 20123.  The opposite op is 20123 -- 123, which fails if
    // LHS doesn't end in RHS, then truncates.
    const sfirst = String(first);
    const sleft = String(left);
    if (sleft.endsWith(sfirst)) {
      if (calc(Number(sleft.slice(0, -sfirst.length)), rest, true) === 0) {
        return 0;
      }
    }
  }
  if (calc(left - first, rest, concat) === 0) {
    return 0;
  };
  if (calc(left / first, rest, concat) === 0) {
    return 0;
  }
  return left;
}

function part1(inp: Parsed): number {
  let sum = 0;
  for (const [tot, operands] of inp) {
    if (calc(tot, operands.reverse()) === 0) {
      sum += tot;
    }
  }
  return sum;
}

function part2(inp: Parsed): number {
  let sum = 0;
  for (const [tot, operands] of inp) {
    // Already reversed
    if (calc(tot, operands, true) === 0) {
      sum += tot;
    }
  }
  return sum;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
