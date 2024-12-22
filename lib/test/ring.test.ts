import { assertEquals } from '@std/assert/equals';
import { Ring } from '../ring.ts';

Deno.test('Ring', async (t) => {
  await t.step('create', () => {
    const r = new Ring<number>(4);
    assertEquals(r.get(), []);
    assertEquals(r.size, 0);
    assertEquals(r.count, 0);
    assertEquals(r.full, false);

    r.push(1);
    assertEquals(r.get(), [1]);
    assertEquals(r.size, 1);
    assertEquals(r.count, 1);
    assertEquals(r.full, false);

    r.push(2);
    r.push(3);
    r.push(4);
    assertEquals(r.get(), [1, 2, 3, 4]);
    assertEquals(r.size, 4);
    assertEquals(r.count, 4);
    assertEquals(r.full, true);

    r.push(5);
    assertEquals(r.get(), [2, 3, 4, 5]);
    assertEquals(r.size, 4);
    assertEquals(r.count, 5);
    assertEquals(r.full, true);
  });
});
