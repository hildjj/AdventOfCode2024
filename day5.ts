import { Point, PointSet } from './lib/rect.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = [[number, number][], number[][]];

function part1(inp: number[][][]): number {
  return inp
    .filter(([before, after]) => before.join(',') === after.join(','))
    .reduce((t, [before]) => t + before[Math.floor(before.length / 2)], 0);
}

function part2(inp: number[][][]): number {
  return inp
    .filter(([before, after]) => before.join(',') !== after.join(','))
    .reduce((t, [_, after]) => t + after[Math.floor(after.length / 2)], 0);
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  // These are number tuples, not points, but... shrug.
  const order = new PointSet();
  for (const [x, y] of inp[0]) {
    order.add(new Point(x, y));
  }
  const beforeAndAfter = inp[1].map((pages) => {
    const sorted = [...pages].sort((a, b) => {
      if (order.has(new Point(a, b))) {
        return -1;
      }
      // There are no pairs that aren't in one direction or the other.
      return 1;
    });
    return [pages, sorted];
  });
  return [part1(beforeAndAfter), part2(beforeAndAfter)];
}
