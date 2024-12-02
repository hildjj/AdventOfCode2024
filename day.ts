#!/usr/bin/env -S deno run -A

import $ from '$dax';
import { assertEquals } from '$std/assert/mod.ts';
import { fromFileUrl, parse as pathParse } from '$std/path/mod.ts';
import { parseArgs } from '$std/cli/parse_args.ts';
import { adjacentFile, type MainArgs, type MainEntry } from './lib/utils.ts';
import { CookieJar, wrapFetch } from '$jar';
import { format } from '@std/fmt/duration';

const YEAR = 2024;

const args = parseArgs(Deno.args, {
  boolean: [
    'benchmark',
    'help',
    'new',
    'record',
    'test',
    'trace',
    'nowait',
    'inputs',
  ],
  string: ['day'],
  alias: {
    b: 'benchmark',
    d: 'day',
    h: 'help',
    i: 'inputs',
    n: 'new',
    r: 'record',
    t: 'test',
    T: 'trace',
  },
  default: {
    trace: false,
    day: '',
  },
});

if (args.help) {
  console.log(`\
day.ts [options] [ARGS]

ARGS passed to day's main function as args._

Options:
  -b,--benchmark    Run benchmarks
  -d,--day <number> Day (default: latest day unless --new)
  -h,--help         Print help text and exit
  -i,--inputs       Get inputs for the target day.  Implied by --new.
  -n,--new          Wait until drop time, then scaffold today's solution
  -r,--record       Record results as test data
  -t,--test         Check test results
  -T,--trace        Turn on grammar tracing
  --nowait          Do not wait until drop time, for testing`);
  Deno.exit(64);
}

const template: string[] = [];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (ms <= 0) {
      resolve();
    } else {
      setTimeout(resolve, ms);
    }
  });
}

async function last(): Promise<string> {
  const p = pathParse(fromFileUrl(import.meta.url));
  let max = -Infinity;
  for await (const f of Deno.readDir(p.dir)) {
    let m = f.name.match(/^day(\d+)\.ts$/);
    if (m) {
      max = Math.max(max, parseInt(m[1], 10));
    }
    m = f.name.match(/^day0\./);
    if (m) {
      template.push(f.name);
    }
  }
  return max.toString();
}

if (!args.day) {
  args.day = await last();
}

export async function newDay(a: MainArgs): Promise<void> {
  a.inputs = true;
  if (template.length === 0) {
    await last();
  } else {
    a.day = String(parseInt(a.day, 10) + 1);
  }

  if (!a.nowait) {
    const d = new Date(
      Date.UTC(YEAR, 11, parseInt(a.day, 10), 5, 0, 0, 300),
    );
    const ms = d.getTime() - Date.now();
    console.log(`Waiting until ${d.toISOString()} (${format(ms)})`);
    await wait(ms);
  }

  await $`open https://adventofcode.com/${YEAR}/day/${a.day}`;

  await $`git co -b day${a.day}`;

  const copies = template.map((f) => [
    new URL(f, import.meta.url),
    new URL(f.replace('0', a.day), import.meta.url),
  ]);

  // Copy to new day
  await Promise.all(copies.map(([from, to]) => Deno.copyFile(from, to)));

  for (const [_from, to] of copies) {
    await $`code ${fromFileUrl(to)}`;
  }
}

export async function inputs(a: MainArgs): Promise<string> {
  const inputFile = adjacentFile(a, 'txt', 'inputs');
  try {
    await Deno.stat(inputFile);
  } catch (_ignored) {
    const aoc = Deno.env.get('AOC_COOKIE');
    if (!aoc) {
      console.error('No AOC_COOKIE environment variable');
      Deno.exit(1);
    }
    const cookieJar = new CookieJar([{
      name: 'session',
      value: aoc,
      domain: 'adventofcode.com',
      path: '/',
      secure: true,
      httpOnly: false,
    }]);
    const fetch = wrapFetch({ cookieJar });
    const inputSrc = `https://adventofcode.com/${YEAR}/day/${a.day}/input`;
    console.log(`Fetching ${inputSrc}`);
    const headers = new Headers({
      'user-agent':
        `github.com/hildjj/AdventOfCode${YEAR} by joe-github@cursive.net`,
    });
    const res = await fetch(inputSrc, { headers });
    const input = await res.text();
    if (!res.ok) {
      console.error(res.status, res.statusText);
      console.error(input);
      Deno.exit(1);
    }
    await Deno.writeTextFile(inputFile, input);
  }
  return inputFile;
}

export async function test(args: MainArgs): Promise<void> {
  const mod = (await import(
    new URL(`day${args.day}.ts`, import.meta.url).toString()
  )).default as MainEntry<unknown>;

  try {
    if (args.benchmark) {
      Deno.bench(
        `Day ${args.day}`,
        { permissions: { read: true } },
        async () => {
          await mod(args);
        },
      );
    }
    const results = await mod(args);
    const { duration } = performance.measure(`run_${args.day}`, args.day);

    if (args.record) {
      const str = Deno.inspect(results, {
        colors: false,
        compact: true,
        depth: Infinity,
        iterableLimit: Infinity,
        strAbbreviateSize: Infinity,
        trailingComma: true,
      }).replaceAll('[ ', '[').replaceAll(' ]', ']');

      await Deno.writeTextFile(
        adjacentFile(args, 'js', 'test'),
        `export default ${str};\n`,
      );
    }

    if (args.test) {
      const expected = await import(adjacentFile(args, 'js', 'test'));
      assertEquals(results, expected.default);
    }

    console.log(Deno.inspect(results, {
      colors: Deno.stdout.isTerminal(),
      depth: Infinity,
      iterableLimit: Infinity,
      strAbbreviateSize: Infinity,
      trailingComma: true,
    }));

    // Does not include parser generation or parse time, which are roughly
    // a constant 8ms on my box.
    console.log(`${duration.toFixed(4)} ms`);
  } catch (er) {
    console.error(er);
  }
}

if (import.meta.main) {
  if (args.new) {
    await newDay(args);
  }

  if (args.inputs) {
    const inputFile = await inputs(args);
    if (args.new) {
      await $`code ${inputFile}`;
      Deno.exit(0);
    }
  }

  await test(args);
}
