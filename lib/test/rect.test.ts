import { Point, Rect } from '../rect.ts';

import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from '$std/assert/mod.ts';

Deno.test('Point', async (t) => {
  await t.step('modifications', () => {
    const p = new Point({ x: 3, y: 4 });
    const p1 = p.xlate(new Point(6, -1));
    assertEquals(p1.x, 9);
    assertEquals(p1.y, 3);
    const p2 = p.xlate(0, -5);
    assert(p2.equals({ x: 3, y: -1 }));
    const p3 = p.stretch(2);
    assertEquals(p3, new Point(6, 8));
  });

  await t.step('distances', () => {
    const p1 = new Point(6, 8);
    const p2 = new Point(9, 12);
    assertEquals(p1.dist(p2), 5);
    assertEquals(p1.manhattan(p2), 7);
  });

  await t.step('inspect', () => {
    const p = new Point(9, 8);
    assertEquals(p.toString(), '9,8');
    assertEquals(Deno.inspect(p), '9,8');
  });
});

Deno.test('Rect', async (t) => {
  const r = new Rect([
    'abc'.split(''),
    'def'.split(''),
  ]);

  await t.step('ofSize', () => {
    const s = Rect.ofSize(10, 5, 6);
    assertEquals(s.width, 10);
    assertEquals(s.height, 5);
    assertEquals(s.get(9, 4), 6);

    const t = Rect.ofSize(10, 5, (x, y) => x * y);
    assertEquals(t.get(9, 4), 36);
  });

  await t.step('#check', () => {
    assertThrows(() => r.get(0, 2));
  });

  await t.step('check', () => {
    assertFalse(r.check({ x: -1, y: 0 }));
  });

  await t.step('reduce', () => {
    assertEquals(r.reduce((t, v) => t + v), 'abcdef');
    assertEquals(r.reduce((t, v) => t + v, 'h'), 'habcdef');
    assertEquals(r.reduce((t, v) => t + v.length, 0), 6);
  });

  await t.step('vals', () => {
    assertEquals(r.get(new Point(0, 0)), 'a');
    assertEquals(r.rows(), [['a', 'b', 'c'], ['d', 'e', 'f']]);
    assertEquals(r.columns(), [['a', 'd'], ['b', 'e'], ['c', 'f']]);
  });

  await t.step('transpose', () => {
    assertEquals(r.transpose(), new Rect([['a', 'd'], ['b', 'e'], ['c', 'f']]));
  });

  await t.step('rotate', () => {
    let s = r.rotateClockwise();
    assertEquals(s, new Rect([['d', 'a'], ['e', 'b'], ['f', 'c']]));
    s = r.rotateCounterClockwise();
    assertEquals(s, new Rect([['c', 'f'], ['b', 'e'], ['a', 'd']]));
  });

  await t.step('with', () => {
    const s = r.with(0, 0, 'z');
    assertEquals(r.get(0, 0), 'a');
    assertEquals(s.get(0, 0), 'z');
    assert(r.equals(r));
    assert(s.equals(s));
    assert(!r.equals(s));
    assert(!r.equals(null!));
    assert(!r.equals(Rect.ofSize(3, 5, '')));
    assert(!r.equals(Rect.ofSize(5, 3, '')));
    const p = new Point(0, 0);
    s.set(p, 'p');
    assertEquals(s.get(p), 'p');
    s.set({ x: 0, y: 0 }, 'q');
    assertEquals(s.get({ x: 0, y: 0 }), 'q');
  });

  await t.step('toString', () => {
    assertEquals(r.toString(), 'abc\ndef');
  });

  await t.step('inspect', () => {
    assertEquals(Deno.inspect(r), 'abc\ndef');
  });

  await t.step('forEach', () => {
    let count = 0;
    r.forEach((s, x, y) => {
      assertEquals(s, r.get(x, y));
      count++;
    });
    assertEquals(count, 6);

    count = 0;
    for (const [s, x, y] of r) {
      assertEquals(s, r.get(x, y));
      count++;
    }
    assertEquals(count, 6);

    count = 0;
    for (const [p, s] of r.entries()) {
      assertEquals(s, r.get(p));
      count++;
    }
    assertEquals(count, 6);
  });

  await t.step('wrap', () => {
    const s = r.wrap('X');
    assertEquals(
      s.toString(),
      `\
XXXXX
XabcX
XdefX
XXXXX`,
    );
  });
});
