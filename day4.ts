import { type MainArgs, parseFile } from './lib/utils.ts';
import { AllBoxDirs, BoxDir, Rect } from './lib/rect.ts';

type Parsed = string[][];

function part1(inp: Parsed): number {
  let tot = 0;
  const r = new Rect(inp);
  const Xs = r.filter((v) => v === 'X');

  for (const x of Xs) {
    for (const dir of AllBoxDirs) {
      if (r.ray(x, dir, 4).join('') === 'XMAS') {
        tot++;
      }
    }
  }

  return tot;
}

function part2(inp: Parsed): number {
  let tot = 0;
  const r = new Rect(inp);
  const As = r.filter((v) => v === 'A');

  const corners = [BoxDir.NW, BoxDir.SE, BoxDir.NE, BoxDir.SW];
  for (const a of As) {
    const letters = corners.map((d) => {
      const p = a.inBoxDir(d, r);
      return p ? r.get(p) : undefined;
    });
    if (letters.some((p) => (p !== 'M') && (p !== 'S'))) {
      continue;
    }
    if (letters[0] === letters[1]) {
      continue;
    }
    if (letters[2] === letters[3]) {
      continue;
    }
    tot++;
  }
  return tot;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
