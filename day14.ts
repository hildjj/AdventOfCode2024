import { Point } from './lib/rect.ts';
import { div, type MainArgs, mod, parseFile } from './lib/utils.ts';
import { Counter } from './lib/counter.ts';

type Parsed = [px: number, py: number, vx: number, vy: number][];

const STEPS = 100;
const WIDTH = 101;
const HEIGHT = 103;

function part1(inp: Parsed): number {
  const pos: Point[] = [];
  for (const [px, py] of inp) {
    pos.push(new Point(px, py));
  }

  for (let j = 0; j < pos.length; j++) {
    const p = pos[j];
    const [_px, _py, vx, vy] = inp[j];
    pos[j] = new Point(
      mod(p.x + (vx * STEPS), WIDTH),
      mod(p.y + (vy * STEPS), HEIGHT),
    );
  }

  const hx = div(WIDTH, 2);
  const hy = div(HEIGHT, 2);
  const tots = [0, 0, 0, 0];
  for (const p of pos) {
    if (p.x < hx) {
      if (p.y < hy) {
        tots[0]++;
      } else if (p.y > hy) {
        tots[1]++;
      }
    } else if (p.x > hx) {
      if (p.y < hy) {
        tots[2]++;
      } else if (p.y > hy) {
        tots[3]++;
      }
    }
  }
  return tots.reduce((t, v) => t * v, 1);
}

function part2(inp: Parsed): number {
  const pos: Point[] = [];
  for (const [px, py] of inp) {
    pos.push(new Point(px, py));
  }

  // I found the setpoints by writing images to the terminal and fiddling with
  // the constants.  Used Jimp and term-img.
  for (let i = 0; i < Infinity; i++) {
    const xc = new Counter<number>();
    const yc = new Counter<number>();
    for (let j = 0; j < pos.length; j++) {
      const p = pos[j];
      const [_px, _py, vx, vy] = inp[j];
      const [nx, ny] = [mod(p.x + vx, WIDTH), mod(p.y + vy, HEIGHT)];
      pos[j] = new Point(nx, ny);
      xc.add(nx); // Count the number of pixels in each vertical line
      yc.add(ny); // Each horizontal line
    }

    if (((xc.max()?.[1] ?? 0) > 30) && ((yc.max()?.[1] ?? 0) > 30)) {
      // The box around the tree.
      return i + 1;
    }
  }
  return NaN;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
