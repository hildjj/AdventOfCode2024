// Adapted from https://github.com/bsoyka/advent-of-code-ocr

// These are sparse, because they are all that we've documented so far from
// AoC outputs.  Add more as they are found.
// Periods instead of spaces to ward against editors trimming lines.
const KNOWN_CHARS = ' ABCEFGHIJKLOPRSUYZ';
const KNOWN = `\
......##..###...##..####.####..##..#..#..###...##.#..#.#.....##..###..###...###.#..#.#....####.
.....#..#.#..#.#..#.#....#....#..#.#..#...#.....#.#.#..#....#..#.#..#.#..#.#....#..#.#.......#.
.....#..#.###..#....###..###..#....####...#.....#.##...#....#..#.#..#.#..#.#....#..#..#.#...#..
.....####.#..#.#....#....#....#.##.#..#...#.....#.#.#..#....#..#.###..###...##..#..#...#...#...
.....#..#.#..#.#..#.#....#....#..#.#..#...#..#..#.#.#..#....#..#.#....#.#.....#.#..#...#..#....
.....#..#.###...##..####.#.....###.#..#..###..##..#..#.####..##..#....#..#.###...##....#..####.
`;

const KNOWN10_CHARS = ' ABCEFGHJKLNPRXZ';
const KNOWN10 = `\
.........##...#####...####..######.######..####..#....#....###.#....#.#......#....#.#####..#####..#....#.######.
........#..#..#....#.#....#.#......#......#....#.#....#.....#..#...#..#......##...#.#....#.#....#.#....#.....#..
.......#....#.#....#.#......#......#......#......#....#.....#..#..#...#......##...#.#....#.#....#..#..#......#..
.......#....#.#....#.#......#......#......#......#....#.....#..#.#....#......#.#..#.#....#.#....#..#..#.....#...
.......#....#.#####..#......#####..#####..#......######.....#..##.....#......#.#..#.#####..#####....##.....#....
.......######.#....#.#......#......#......#..###.#....#.....#..##.....#......#..#.#.#......#..#.....##....#.....
.......#....#.#....#.#......#......#......#....#.#....#.....#..#.#....#......#..#.#.#......#...#...#..#..#......
.......#....#.#....#.#......#......#......#....#.#....#.#...#..#..#...#......#...##.#......#...#...#..#..#......
.......#....#.#....#.#....#.#......#......#...##.#....#.#...#..#...#..#......#...##.#......#....#.#....#.#......
.......#....#.#####...####..######.#......###.#..#....#..###...#....#.######.#....#.#......#....#.#....#.######.
`;

/**
 * Split a string of picture characters by character.
 *
 * @param lines - 6 lines of on/off characters, that have already been
 *   normalized to "#"/" ".  If not an array, assumes "\\n" as the line splitter.
 * @returns An array, with each picture character as a single newline-joined
 *   string.
 */
function splitChars(lines: string | string[], charWidth = 5): string[] {
  if (typeof lines === 'string') {
    lines = lines.replace(/\n+$/, ''); // Take off any trailing newline
    lines = lines.split('\n');
  }
  const width = lines[0].length;
  const res: string[] = [];
  for (let i = 0; i < width; i += charWidth) {
    const char = [];
    for (const line of lines) {
      char.push(line.substring(i, i + charWidth - 1));
    }
    res.push(char.join('\n'));
  }
  return res;
}

const CHARS: Record<string, string> = {};
const PICS: Record<string, string[]> = {};
splitChars(normalize(KNOWN, [['.', ' ']])).forEach((pic, i) => {
  CHARS[pic] = KNOWN_CHARS[i];
  PICS[KNOWN_CHARS[i]] = pic.split('\n');
});

const CHARS10: Record<string, string> = {};
const PICS10: Record<string, string[]> = {};
splitChars(normalize(KNOWN10, [['.', ' ']]), 7).forEach((pic, i) => {
  CHARS10[pic] = KNOWN10_CHARS[i];
  PICS10[KNOWN10_CHARS[i]] = pic.split('\n');
});

type Xform = [string, string][];

/**
 * Perform a set of from-to mappings on a string, if they are needed.
 *
 * @param s - String to transform.
 * @param xform - List of string-to-string replacements
 * @returns Normalized string.
 */
function normalize(s: string, xform: Xform): string {
  let ret = s;
  for (const [from, to] of xform) {
    if (from !== to) {
      ret = ret.replaceAll(from, to);
    }
  }
  return ret;
}

/**
 * Convert a string or array of 6 lines of strings, where the lines encode
 * Advent of Code 6x4 bitmap characters, into their equivalent ASCII characters.
 * Note that this only works for space and *some* upper-case letters.
 *
 * @param lines - Input string or lines.
 * @param on - What character is an "on" bit?
 * @param off - What character is an "off" bit?
 * @returns Corresponding simple string.
 */
export function ocr(
  lines: string | string[],
  { on = '#', off = ' ', height = 6 } = {},
): string {
  const xform: Xform = [[on, '#'], [off, ' ']];

  if (typeof lines === 'string') {
    lines = lines.replace(/\n+$/, ''); // Take off any trailing newline
    lines = lines.split('\n');
  }

  const max = Math.max(...lines.map((s) => s.length));
  lines = lines.map((s) => s.padEnd(max, off));

  const norm = lines.map((line) => normalize(line, xform));

  return splitChars(norm, (height === 10) ? 7 : 5).map((c) => {
    const cc = (height === 10) ? CHARS10[c] : CHARS[c];
    if (!cc) {
      throw new Error(`Unknown character:\n${normalize(c, [[' ', '.']])}`);
    }
    return cc;
  }).join('');
}

/**
 * Convert ASCII text to Advent of Code 6x4 bitmaps, all in a row.
 * This is mostly useful for generating tests.
 *
 * @param s - The string to convert.  Must be spaces or supported uppercase letters.
 * @param on - The "on" character
 * @param off - The "off" character
 * @returns - Newline-joined bitmap with the on/off bits as specified
 */
export function render(
  s: string,
  { on = '#', off = ' ', height = 6 } = {},
): string {
  const xform: Xform = [['#', on], [' ', off]];
  const lines = Array.from(new Array(height), () => '');
  for (const c of s) {
    const pc = (height === 10) ? PICS10[c] : PICS[c];
    if (!pc) {
      throw new Error(`Unknown letter: "${c}"`);
    }
    const pic = pc.map((p) => normalize(p, xform));
    pic.forEach((p, i) => {
      lines[i] += p + off;
    });
  }
  return lines.join('\n');
}
