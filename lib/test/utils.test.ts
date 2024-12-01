import {
  adjacentFile,
  defaultArgs,
  divmod,
  gcd,
  lcm,
  mod,
  parseFile,
  readAllLines,
  readLines,
} from '../utils.ts';
import { assertEquals, assertRejects, assertThrows } from '$std/assert/mod.ts';
import { fromFileUrl } from '$std/path/from_file_url.ts';
import peggy from 'peggy';

const INVALID_FILE = `_____DOES___NOT___EXIST:${Deno.pid}`;

Deno.test('Utils', async (t) => {
  await t.step('divmod', () => {
    assertEquals(divmod<number>(4, 4), [1, 0]);
    assertEquals(divmod<number>(-5, 4), [-2, 3]);

    assertEquals(divmod<bigint>(4n, 4n), [1n, 0n]);
    assertEquals(divmod<bigint>(-5n, 4n), [-2n, 3n]);
    assertEquals(divmod<bigint>(-5n, -4n), [1n, -1n]);

    assertThrows(() => divmod(4, 0), Error, 'Division by zero');
    assertThrows(() => divmod(4n, 0n), Error, 'Division by zero');
  });

  await t.step('mod', () => {
    assertEquals(mod<number>(4, 4), 0);
    assertEquals(mod<number>(-5, 4), 3);
    assertEquals(mod<bigint>(4n, 4n), 0n);
    assertEquals(mod<bigint>(-5n, 4n), 3n);
    assertEquals(mod<bigint>(-5n, -4n), -1n);
    assertThrows(() => mod(4, 0), Error, 'Division by zero');
    assertThrows(() => mod(4n, 0n), Error, 'Division by zero');
  });

  await t.step('gcd', () => {
    assertThrows(() => gcd());
    assertEquals(gcd(8), 8);
    assertEquals(gcd(8n), 8n);
    assertEquals(gcd(8, 12), 4);
    assertEquals(gcd(8n, 12n), 4n);
    assertEquals(gcd(8, 12, 16), 4);
    assertEquals(gcd(8n, 12n, 16n), 4n);
  });

  await t.step('lcm', () => {
    assertEquals(lcm(8, 12), 24);
    assertEquals(lcm(8n, 12n), 24n);
  });

  await t.step('readLines', async () => {
    let count = 0;
    for await (const _line of readLines(defaultArgs)) {
      count++;
    }
    assertEquals(count, 2000);
  });

  await t.step('readAllLines', async () => {
    const a = await readAllLines(defaultArgs);
    assertEquals(a.length, 2000);
  });

  await t.step('parseFile', async () => {
    const r = await parseFile<number[]>(defaultArgs);
    assertEquals(r.length, 2000);

    const parser: peggy.Parser = {
      SyntaxError: peggy.generate('a = "b"').SyntaxError,
      // @ts-expect-error Peggy type safety?
      parse(): unknown {
        return ['3', '4'];
      },
    };
    const fn = fromFileUrl(
      new URL('../../inputs/day0.txt', import.meta.url),
    );
    const u = await parseFile<string[]>(defaultArgs, fn, parser);
    assertEquals(u, ['3', '4']);

    await assertRejects(() => parseFile(defaultArgs, INVALID_FILE));
    await assertRejects(() =>
      parseFile(
        defaultArgs,
        undefined,
        adjacentFile({ ...defaultArgs, day: 'Invalid' }, 'peggy', 'test'),
      )
    );
  });
});
