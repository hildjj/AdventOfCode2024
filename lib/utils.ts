import { dirname, fromFileUrl, join } from '@std/path';
import { TextLineStream } from '@std/streams';
import { assert } from '@std/assert';
import peggy from 'peggy';

export interface MainArgs {
  day: string;
  trace?: boolean;
  _?: (string | number)[];
  [x: string]: unknown;
}

export type MainEntry<T> = (args: MainArgs) => Promise<T>;

export const defaultArgs: MainArgs = {
  trace: false,
  day: '0',
  _: [],
};

const grammarCache: Record<string, peggy.Parser> = {};
const inputCache: Record<string, string> = {};
const inputLinesCache: Record<string, string[]> = {};

/**
 * Read file, parse lines.
 *
 * @param args - Args passed in to day.ts
 * @param filename - If null, figures out what day today is
 *   and finds the .txt file.
 * @returns One entry per line.
 */
export async function* readLines(
  args: MainArgs,
  filename?: string,
): AsyncGenerator<string, undefined, undefined> {
  if (!filename) {
    if (args._?.length) {
      filename = String(args._[0]);
    } else {
      filename = adjacentFile(args, 'txt', 'inputs');
    }
  }

  let lines = inputLinesCache[filename];
  if (lines) {
    yield* lines;
    return;
  }

  lines = [];
  const f = await Deno.open(filename);
  const ts = f.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  for await (const s of ts) {
    if (s.length) {
      yield s;
      lines.push(s);
    }
  }
  inputLinesCache[filename] = lines;
}

/**
 * Read all non-blank lines from a file, returning an array.
 *
 * @param args - Args passed in to day.ts
 * @param filename - If null, figures out what day today is
 *   and finds the .txt file.
 * @returns One entry per line.
 */
export async function readAllLines(
  args: MainArgs,
  filename?: string,
): Promise<string[]> {
  const res: string[] = [];
  for await (const line of readLines(args, filename)) {
    res.push(line);
  }
  return res;
}

/**
 * Parse a file.
 *
 * @param args - CLI args
 * @param input - If null, figures out what day today is
 *   and finds the .txt file.
 * @param parser - If a string, the name of the parser
 *   file to require.  If a function, the pre-required parser.  If null,
 *   find the parser with the matching name. If no parser found, split
 *   like `readLines`.
 * @returns The output of the parser.
 */
export async function parseFile<T>(
  args: MainArgs,
  input?: string,
  parser?:
    | string
    | peggy.Parser,
): Promise<T> {
  let text: string | undefined = undefined;
  let source: string | undefined;

  if (!parser) {
    source = adjacentFile(args, 'peggy');
  } else if (typeof parser === 'string') {
    source = parser;
    parser = undefined;
  }

  try {
    let compiled = (parser as peggy.Parser) ?? grammarCache[source!];
    if (!compiled) {
      text = await Deno.readTextFile(source!);

      compiled = peggy.generate(text, {
        trace: args.trace,
        grammarSource: source,
      });
      grammarCache[source!] = compiled;
    }
    source = input;
    if (!source) {
      if (args._?.length) {
        source = String(args._[0]);
      } else {
        source = adjacentFile(args, 'txt', 'inputs');
      }
    }
    text = inputCache[source];
    if (!text) {
      text = await Deno.readTextFile(source);
      inputCache[source] = text;
    }

    const res = compiled.parse(text, {
      grammarSource: source,
      sourceMap: 'inline',
      format: 'es',
    }) as T;
    performance.mark(args.day);
    return res;
  } catch (e) {
    const er = e as peggy.GrammarError;
    if (typeof er.format === 'function') {
      er.message = (er as peggy.GrammarError).format([
        { source, text: text! },
      ]);
    }
    throw er;
  }
}

/**
 * @returns The file with the given extension next to the calling file.
 */
export function adjacentFile(
  args: MainArgs,
  ext: string,
  ...dir: string[]
): string {
  const p = dirname(fromFileUrl(import.meta.url));
  return join(p, '..', ...dir, `day${args.day}.${ext}`);
}

/**
 * Modulo, minus the JS bug with negative numbers.
 * `-5 % 4` should be `3`, not `-1`.
 *
 * @param x - Divisor.
 * @param y - Dividend.
 * @returns Result of x mod y.
 * @throws {@link Error} Division by zero.
 */
export function mod<T extends number | bigint>(x: T, y: T): T {
  // == works with either 0 or 0n.
  // deno-lint-ignore eqeqeq
  if (y == 0) {
    throw new Error('Division by zero');
  }
  // @ts-expect-error: TS2365.  tsc can't see that x and y are always the same type
  return ((x % y) + y) % y;
}

/**
 * Integer result of x / y, plus the modulo (unsigned) remainder.
 *
 * @param x - Divisor.
 * @param y - Dividend.
 * @returns The quotient and remainder.
 */
export function divmod<T extends number | bigint>(x: T, y: T): [T, T] {
  let q = (x / y) as unknown as T;
  const r = mod(x, y);
  if (typeof x === 'bigint') {
    // Not only does Math.floor not work for BigInt, it's not needed because
    // `/` does the right thing in the first place.

    // except for numbers of opposite sign
    if ((q < 0n) && (r > 0n)) {
      // There was a remainder.  JS rounded toward zero, but python
      // rounds down.
      q--;
    }
    return [q, r];
  }
  assert(typeof q === 'number');
  return [Math.floor(q) as T, r];
}

export function gcd<T extends number | bigint>(...n: T[]): T {
  switch (n.length) {
    case 0:
      throw new Error('Invalid input');
    case 1:
      return n[0];
    case 2: {
      let [a, b] = n;
      // Needs to work for both 0 and 0n
      // deno-lint-ignore eqeqeq
      while (b != 0) {
        [a, b] = [b, mod(a, b)];
      }
      return a;
    }
    default:
      return n.reduce((t, v) => gcd(t, v));
  }
}

export function lcm<T extends number | bigint>(...n: T[]): T {
  // TS isn't quite smart enough about generic maths,
  // so there are more `as T` here than I want.
  return n.reduce<T>(
    (t, v) => (((t * v) as T) / gcd(t, v)) as T,
    ((typeof n[0] === 'number') ? 1 : 1n) as T,
  );
}
