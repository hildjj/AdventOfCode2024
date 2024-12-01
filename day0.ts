import { type MainArgs, parseFile } from './lib/utils.ts';

function part1(inp: number[]): number {
  // console.log(inp);
  return inp.length;
}

function part2(inp: number[]): number {
  return inp.length;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<number[]>(args);
  return [part1(inp), part2(inp)];
}
