import { type MainArgs, parseFile } from './lib/utils.ts';

type Op = [left: string, op: string, right: string, output: string];
type Parsed = [inputs: [reg: string, val: boolean][], ops: Op[]];

function doOp(left: boolean, op: string, right: boolean): boolean {
  switch (op) {
    case 'OR':
      return left || right;
    case 'AND':
      return left && right;
    case 'XOR':
      return left !== right;
    default:
      throw new Error(`Invalid op: "${op}"`);
  }
}

function p2(i: bigint): string {
  return String(i).padStart(2, '0');
}

function toNum(state: Map<string, boolean>, prefix: string): bigint {
  let tot = 0n;
  for (let i = 0n; i < 1000000000n; i++) {
    const reg = `${prefix}${p2(i)}`;
    const v = state.get(reg);
    if (v === undefined) {
      return tot;
    }
    tot |= (v ? 1n : 0n) << i;
  }
  return tot;
}

function _fromNum(
  state: Map<string, boolean>,
  prefix: string,
  val: bigint,
): void {
  for (let i = 0n; i < 45n; i++) {
    state.set(`${prefix}${p2(i)}`, (val & 0x1n) === 1n);
    val >>= 1n;
  }
}

function runOps(state: Map<string, boolean>, ops: Op[]): bigint {
  state = new Map(state);
  while (ops.length) {
    const next: [left: string, op: string, right: string, output: string][] =
      [];
    for (const [left, op, right, output] of ops) {
      const L = state.get(left);
      const R = state.get(right);
      if ((L !== undefined) && (R !== undefined)) {
        state.set(output, doOp(L, op, R));
      } else {
        next.push([left, op, right, output]);
      }
    }
    ops = next;
  }
  return toNum(state, 'z');
}

function part1(inp: Parsed): bigint {
  const [inputs, ops] = inp;
  const state = new Map<string, boolean>();
  for (const [reg, val] of inputs) {
    state.set(reg, val);
  }
  return runOps(state, ops);
}

function part2(_inp: Parsed): string {
  // const [inputs, ops] = inp;
  // const state = new Map<string, boolean>();
  // for (const [reg, val] of inputs) {
  //   state.set(reg, val);
  // }
  // const [x, y] = [toNum(state, 'x'), toNum(state, 'y')];
  // const z = x + y;

  // Half-adder:
  // SUM = A ^ B
  // Carry = A & B

  // Full-adder:
  // SUM = Carry-In ^ (A ^ B)
  // Carry-Out = (A & B) | (Carry-In & (A ^ B))
  // Carry-in = 0

  // 1) A AND B -> AaB
  // 2) A XOR B -> AXB
  // 3) CI AND AxB -> COR
  // 4) AaB OR COR -> CO
  // 5) CI XOR AxB -> SUM

  // C0 = 0, so first is half-adder
  // y00 XOR x00 -> z00 (S0)
  // x00 AND y00 -> nqp (C1)
  //
  // 1) y01 AND x01 -> dmk (x1ay1)
  // 2) x01 XOR y01 -> fht (x1Xy1)
  // 3) nqp AND fht -> ntf (cor1)
  // 4) dmk OR ntf -> nrs (C2)
  // 5) fht XOR nqp -> z01 (S1)
  //
  // 1) y02 AND x02 -> pbb
  // 2) x02 XOR y02 -> qdt
  // 3) nrs AND qdt -> mkc
  // 4) pbb OR mkc -> bcm (C3)
  // 5) nrs XOR qdt -> z02 (S2)

  // bdc (C5)
  // 1) y05 AND x05 -> smt
  // 2) y05 XOR x05 -> pvt
  // 3) bdc AND pvt -> chv
  // 4) smt OR chv -> cjt (C6)
  // 5) pvt XOR bdc -> z05

  // Found by looking at all "-> z"
  // 1) x06 AND y06 -> z06 (WRONG: jmq)
  // 2) x06 XOR y06 -> sfm
  // 3) cjt AND sfm -> fmd
  // 4) fmd OR jmq -> qsf
  // 5) cjt XOR sfm -> jmq (WRONG: z06)

  // jqh (C12)
  // 1) y12 AND x12 -> fcd
  // 2) y12 XOR x12 -> kng
  // 3) jqh AND kng -> bnt
  // 4) fcd OR bnt -> kwb (C13)
  // 5) kng XOR jqh -> z12

  // Found by looking at all "-> z"
  // 1) x13 AND y13 -> fjv
  // 2) x13 XOR y13 -> nmm
  // 3) nmm AND kwb -> gbd
  // 4) gbd OR fjv -> z13 (Wrong: gmh) (C14)
  // 5) nmm XOR kwb -> gmh (Wrong: z13)

  // nsf (C37)
  // 1) y37 AND x37 -> kqm
  // 2) y37 XOR x37 -> ndr
  // 3) ndr AND nsf -> jrg
  // 4) jrg OR kqm -> ngk (C38)
  // 5) nsf XOR ndr -> z37

  // Found by looking at all "-> z"
  // 1) y38 AND x38 -> cpg
  // 2) x38 XOR y38 -> njc
  // 3) njc AND ngk -> z38 (Wrong: qrh)
  // 4) cpg OR qrh -> wtp (C39)
  // 5) ngk XOR njc -> qrh (Wrong: z38)

  // ssw (C24)
  // 1) y24 AND x24 -> pww
  // 2) x24 XOR y24 -> mqt
  // 3) mqt AND ssw -> rkw
  // 4) rkw OR pww -> kdt (C25)
  // 5) ssw XOR mqt -> z24

  // Found by fixing the previous three and trying the add loop below
  // kdt (C25)
  // x25 AND y25 -> rqf (Wrong: cbd)
  // x25 XOR y25 -> cbd (Wrong: rqf)
  // kdt AND rqf -> mrj
  // mrj OR cbd -> bjr (C26)
  // rqf XOR kdt -> z25

  // ops.sort((a, b) => a[0].localeCompare(b[0]))
  // const int = new Set(['z25']);
  // for (const [left, op, right, output] of ops) {
  //   if (int.has(left) || int.has(right) || int.has(output)) {
  //     console.log(left, op, right, '->', output)
  //   }
  // }

  // const outs = Object.create(null);
  // ops.forEach(([_left, _op, _right, output], i) => {
  //   outs[output] = i;
  // });

  // ops[outs.z06][3] = 'jmq';
  // ops[outs.jmq][3] = 'z06';
  // ops[outs.z13][3] = 'gmh';
  // ops[outs.gmh][3] = 'z13';
  // ops[outs.z38][3] = 'qrh';
  // ops[outs.qrh][3] = 'z38';

  // ops[outs.cbd][3] = 'rqf';
  // ops[outs.rqf][3] = 'cbd';

  // let num = 0n;
  // for (let i = 0; i < 45; i++) {
  //   num = (num << 1n) | 1n;
  //   const s = new Map(state);
  //   fromNum(s, 'x', num);
  //   fromNum(s, 'y', num);
  //   const z = runOps(s, ops);
  //   if (z !== num + num) {
  //     console.log(i);
  //     break;
  //   }
  // }

  const swaps = ['jmq', 'z06', 'gmh', 'z13', 'qrh', 'z38', 'rqf', 'cbd'];
  return swaps.sort().join(',');
}

export default async function main(args: MainArgs): Promise<[bigint, string]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
