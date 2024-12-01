import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = number[];

function part1(inp: Parsed): number {
  // console.log(inp);
  return inp.length;
}

function part2(inp: Parsed): number {
  return inp.length;
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
