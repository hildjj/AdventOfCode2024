import { defaultArgs, type MainEntry } from '../lib/utils.ts';
import { assertEquals } from '$std/assert/assert_equals.ts';
import { dirname } from '$std/path/dirname.ts';
import { inputs } from '../day.ts';

Deno.test('days', async (t) => {
  for await (const f of Deno.readDir(new URL(dirname(import.meta.url)))) {
    const m = f.name.match(/^day(\d+).js$/);
    if (m) {
      const day = m[1];
      await inputs({ day });
      await t.step(f.name, async () => {
        const expected = await import(
          new URL(f.name, import.meta.url).toString()
        );
        const main = (await import(
          new URL(`../day${day}.ts`, import.meta.url).toString()
        )).default as MainEntry<unknown>;
        const results = await main({ ...defaultArgs, day });
        assertEquals(results, expected.default);
      });
    }
  }
});
