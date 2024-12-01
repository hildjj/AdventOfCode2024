# Advent of Code 2024

My solutions to [AdventOfCode 2024](https://adventofcode.com/2024)

## Automation

This script/repo/tool does follow the automation guidelines on the
/r/adventofcode [community wiki](https://www.reddit.com/r/adventofcode/wiki/faqs/automation). Specifically:

- Outbound calls are made once from the developer's machine to retrieve the
  day's inputs, then those inputs are stored into a private repo that
  Github Actions has access to in order to perform CI.
- If you suspect your input is corrupted, you can manually request a fresh
  copy by deleting the cached version in the inputs/ directory.
- The User-Agent header in userAgentHeaderFunction() is set to me since I
  maintain this tool.

## Pre-requisites

- [Deno](https://deno.com/) 2.1.2
- git
- An implementation of `open` that opens URLs in your browser. MacOSX has one.
- Visual Studio Code, with the command-line tool `code` installed.
- genhtml from the [lcov](https://github.com/linux-test-project/lcov) package
  (`brew install lcov`)

## Before the new day drops

Run `day.ts` with the `-n` argument. This will wait until today's puzzle
becomes available, then download today's input, open today's puzzle
description, and pull up boilerplate ready to be filled in with today's
solution.

```sh
$ ./day.ts -n
Waiting until 2024-12-01T05:00:00.300Z
```

## Writing your solution

Each AoC puzzle consists of two related problems. Usually the first one is
trying to get you to solve the puzzle in an obvious way, and the second part
blows up in complexity, runtime, memory, etc. if you took the wrong path --
particularly later in the month.

Every puzzle has an input file that is specific to you, which will be written
to `inputs/day1.txt` (e.g.). The first task of the day is always parsing this
file. If we are lucky, you can use `Utils.readAllLines()` to get all of the
blank lines. If not, I write a quick [Peggy](https://peggyjs.org/) parser.

In `day1.ts` (e.g.), you parse the input file once in the main function, then
write your `part1` and `part2` solutions in the appropriate functions.

```ts
import { type MainArgs, Utils } from './utils.ts';

// Return type is often number, sometimes string.  Change as necessary.
function part1(inp: number[]): number {
  return inp.length;
}

// Part2 sometimes just requires a shift to bigint instead of number.
function part2(inp: number[]): bigint {
  return inp.reduce((t, v) => t + BigInt(v), 0n);
}

// Don't forget to change the return type to match part1 and part2
export default async function main(args: MainArgs): Promise<[number, bigint]> {
  // This reads day1.peggy, parses, and returns whatever AST-like thing you
  // parsed.
  const inp = await Utils.parseFile<number[]>(args);

  // Return an array of the two answers.
  return [part1(inp), part2(inp)];
}
```

## Building blocks

The `utils.ts` file has a bunch of random stuff that I find myself needing,
like lowest-common-denominator and greatest-common-multiple routines.

The `counter.ts` is a bag of string=>number counters that deal with inserting
1 the first time and incrementing from there. This comes up a lot.

The `sequence.ts` file does a _bunch_ of sequence munging. If you need
combinations or permutations, start there.

## Running

Run today's solution with `day.ts`. If you would like to record the current
output as canonical, so that future testing will check that you still get the
same results, use `day.ts -r`. To run today's tests, `day.ts -t`.

## Tests

To run the tests for all days, `deno task test`, will run all of the tests,
and leave coverage information as HTML in `coverage/html/index.html` and
surrounding files.

## `day.ts` CLI

```txt
day.ts [options] [ARGS]

ARGS passed to day's main function as args._

Options:
  -d,--day <number> Day (default: latest day unless --new)
  -h,--help         Print help text and exit
  -n,--new          Wait until drop time, then scaffold today's solution
  -r,--record       Record results as test data
  -t,--test         Check test results
  -T,--trace        Turn on grammar tracing
  --nowait          Do not wait until drop time, for testing
```

[![Test Deno Module](https://github.com/hildjj/AdventOfCode2024/actions/workflows/deno.yml/badge.svg)](https://github.com/hildjj/AdventOfCode2024/actions/workflows/deno.yml)
[![codecov](https://codecov.io/gh/hildjj/AdventOfCode2024/graph/badge.svg?token=B5VBNZ7BOF)](https://codecov.io/gh/hildjj/AdventOfCode2024)
