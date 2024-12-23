import { Counter, NumberCounter } from '../counter.ts';
import { assertEquals } from '@std/assert';

Deno.test('Counter', () => {
  const c = new Counter<number>();
  assertEquals(c.max(), undefined);
  assertEquals(c.size, 0);

  c.add(1, 2); // 1
  assertEquals(c.get(1, 2), 1);
  assertEquals(c.get(33), 0);
  assertEquals(c.values(), [1]);
  c.add(1, 2); // 2
  c.add(3, 4); // 1
  assertEquals(c.keys(), ['1,2', '3,4']);
  c.sum(-5, 3, 4); // -4
  c.sum(-6, 3, 5); // -6
  assertEquals(c.total(), -8);
  assertEquals(c.total((p) => p > 0), 1);
  assertEquals(c.total((p) => p), -8);
  let count = 0;
  for (const [_, p] of c) {
    count += p;
  }
  assertEquals(count, -8);
  assertEquals(c.max(), ['1,2', 2]);
  assertEquals(c.size, 3);

  c.addAll([10, 11, 12]);
  assertEquals(c.size, 6);
});

Deno.test('NumberCounter', () => {
  const c = new NumberCounter();
  assertEquals(c.max(), undefined);
  assertEquals(c.size, 0);

  c.add(1); // 1
  assertEquals(c.get(1), 1);
  assertEquals(c.get(33), 0);
  assertEquals([...c.values()], [1]);
  c.add(1); // 2
  c.add(3); // 1
  assertEquals([...c.keys()], [1, 3]);
  c.sum(-5, 3); // -4
  c.sum(-6, 4); // -6
  assertEquals(c.total(), -8);
  assertEquals(c.total((p) => p > 0), 1);
  assertEquals(c.total((p) => p), -8);
  let count = 0;
  for (const [_, p] of c) {
    count += p;
  }
  assertEquals(count, -8);
  assertEquals(c.max(), [1, 2]);
  assertEquals(c.size, 3);

  c.addAll([10, 11, 12]);
  assertEquals(c.size, 6);
});
