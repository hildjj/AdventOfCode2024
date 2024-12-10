import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = number[];
type File = [block: number, length: number];

function genBlocks(inp: Parsed): [blocks: number[], files: File[]] {
  const blocks: number[] = [];
  const files: File[] = [];
  let file = 0;
  let free = false;
  let block = 0;

  for (const n of inp) {
    if (free) {
      for (let i = 0; i < n; i++) {
        blocks[block++] = NaN;
      }
    } else {
      files.push([block, n]);
      for (let i = 0; i < n; i++) {
        blocks[block++] = file;
      }
      file++;
    }
    free = !free;
  }

  return [blocks, files];
}

function part1(inp: Parsed): number {
  const [blocks, files] = genBlocks(inp);
  let file = files.length;
  let i = 0;
  let j = blocks.length - 1;
  while (i < j) {
    while (i < j) {
      if (isNaN(blocks[i])) {
        break;
      }
      i++;
    }
    while (j > i) {
      file = blocks[j];
      blocks[j] = NaN;
      if (!isNaN(file)) {
        break;
      }
      j--;
    }
    if (i < j) {
      blocks[i] = file;
    } else {
      break;
    }
  }

  return blocks.reduce((t, v, n) => t + (isNaN(v) ? 0 : v * n), 0);
}

function part2(inp: Parsed): number {
  const [blocks, files] = genBlocks(inp);
  let initial = 0;

  for (let file = files.length - 1; file >= 0; file--) {
    const [start, len] = files[file];

    let i = initial;
    initial = NaN;

    OUTER:
    while (i < start) {
      while (i < start) {
        if (isNaN(blocks[i])) {
          if (isNaN(initial)) {
            initial = i;
          }
          break;
        }
        i++;
      }
      if (i < start) {
        for (let x = i; x < i + len; x++) {
          if (!isNaN(blocks[x])) {
            i = x;
            continue OUTER;
          }
        }
        break;
      }
    }
    if (i < start) {
      const end = start + len;
      blocks.copyWithin(i, start, end);
      blocks.fill(NaN, start, end);
      i += len;
    }
  }

  return blocks.reduce((t, v, n) => t + (isNaN(v) ? 0 : v * n), 0);
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
