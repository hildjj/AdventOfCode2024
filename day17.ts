import { type MainArgs, parseFile } from './lib/utils.ts';

interface Registers {
  A: bigint;
  B: bigint;
  C: bigint;
}
type Parsed = [registers: Registers, program: bigint[]];

function run(reg: Registers, program: bigint[]): bigint[] {
  let pc = 0;
  let operand = 0n;
  const out = [];

  function combo(): bigint {
    switch (operand) {
      case 0n:
      case 1n:
      case 2n:
      case 3n:
        return operand;
      case 4n:
        return reg.A;
      case 5n:
        return reg.B;
      case 6n:
        return reg.C;
      default:
        throw RangeError(`Invalid combo operand ${operand}`);
    }
  }

  while (pc < program.length) {
    operand = program[pc + 1];
    switch (program[pc]) {
      case 0n: // trunc(A / 2 ** combo) -> A
        reg.A = reg.A / (2n ** combo());
        break;
      case 1n: // B ^ lit -> B
        reg.B = reg.B ^ operand;
        break;
      case 2n: // combo mod 8 -> B
        reg.B = combo() % 8n;
        break;
      case 3n: // no-op if A=0, lit -> pc, no pc increment after jump
        if (reg.A !== 0n) {
          pc = Number(operand) - 2; // pc+=2 below
        }
        break;
      case 4n: // B ^ C -> B, ignores operand
        reg.B = reg.B ^ reg.C;
        break;
      case 5n: // combo mod 8 -> stdout, separated by commas [A program!]
        out.push(combo() % 8n);
        break;
      case 6n: // trunc(A / 2 ** combo) -> B
        reg.B = reg.A / (2n ** combo());
        break;
      case 7n: // trunc(A / 2 ** combo) -> C
        reg.C = reg.A / (2n ** combo());
        break;
      default:
        throw new RangeError(`Invalid opcode: ${program[pc]}`);
    }
    pc += 2;
  }
  return out;
}

function part1(inp: Parsed): string {
  const [registers, program] = inp;
  return run(registers, program).join(',');
}

function part2(inp: Parsed): bigint {
  const [_registers, program] = inp;

  // For each number in the program, starting at the end,
  // Find a number between 0-7 that generates that number.
  // <<3, go to the next number, and generate that.

  // At each level, there are 1+ matches.  Store all of them, and try
  // each at the next level.

  const rp = program.toReversed();
  let vals = [0n];

  while (rp.length) {
    const dig = rp.shift();
    const prevVals = vals;
    vals = [];
    for (const prev of prevVals) {
      const p3 = prev << 3n;
      for (let i = 0n; i < 8n; i++) {
        const A = p3 | i;
        const res = run({ A, B: 0n, C: 0n }, program);
        if (res[0] === dig) {
          vals.push(A);
        }
      }
    }
  }

  // Minimum
  return vals.reduce((t, v) => v < t ? v : t);
}

export default async function main(args: MainArgs): Promise<[string, bigint]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
