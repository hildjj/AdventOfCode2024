import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = number[];

function genBlocks(inp: Parsed): [blocks: number[], file: number] {
  const blocks: number[] = [];
  let file = 0;
  let free = false;
  let block = 0;
  for (const n of inp) {
    if (free) {
      for (let i=0; i<n; i++) {
        blocks[block++] = NaN;
      }
    } else {
      for (let i=0; i<n; i++) {
        blocks[block++] = file;
      }
      file++;
    }
    free = !free;
  }

  return [blocks, file - 1];
}

function part1(inp: Parsed): number {
  const [blocks, maxFile] = genBlocks(inp);
  let file = maxFile;
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
      delete blocks[j];
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

  return blocks.reduce((t, v, n) => t + (v === undefined ? 0 : v * n), 0);
}

function part2(inp: Parsed): number {
  const [blocks, maxFile] = genBlocks(inp);
  let initial = 0;

  for (let file = maxFile; file >= 0; file--) {
    // TODO: move to lastIndexOf
    const start = blocks.indexOf(file, initial);
    if (start === -1) {
      continue;
    }
    let end = start;
    while (end < blocks.length) {
      if (blocks[++end] !== file) {
        break;
      }
    }

    const len = end - start;
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
      for (let x = i; x < i + len; x++) {
        blocks[x] = file;
        blocks[start + x - i] = NaN;
      }
      i += len;
    }
  }

  return blocks.reduce((t, v, n) => t + (isNaN(v) ? 0 : v * n), 0);
}

export default async function main(args: MainArgs): Promise<[number, number]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
