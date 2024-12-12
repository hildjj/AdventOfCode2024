import { Dir, InfiniteRect, Point, PointSet, Rect } from '../rect.ts';
import { assert, assertEquals, assertFalse, assertThrows } from '@std/assert';

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
    assertEquals(p.inDir(Dir.E), new Point(4, 4));
    assertEquals(p.inDir(Dir.W), new Point(2, 4));
    assertEquals(p.inDir(Dir.N), new Point(3, 3));
    assertEquals(p.inDir(Dir.S), new Point(3, 5));
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

  await t.step('neighbors', () => {
    const p = new Point(6, 8);
    assertEquals(p.cardinal(), [
      new Point(7, 8),
      new Point(6, 9),
      new Point(5, 8),
      new Point(6, 7),
    ]);
    assertEquals(p.cardinal(Rect.ofSize(8, 8, '')), [
      new Point(6, 7),
    ]);
  });

  await t.step('sort', () => {
    const points = [new Point(2, 3), new Point(2, 1), new Point(1, 2)];
    points.sort(Point.sort);
    assertEquals(points, [
      new Point(1, 2),
      new Point(2, 1),
      new Point(2, 3),
    ]);
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
    const t = r.with(new Point(0, 0), 't');
    assertEquals(Deno.inspect(t), 'tbc\ndef');
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

  await t.step('map', () => {
    const s = r.map(() => 'z');
    assertEquals(Deno.inspect(s), 'zzz\nzzz');
  });

  await t.step('indexOf', () => {
    const p = r.indexOf('e');
    assertEquals(p, new Point(1, 1));
    assertEquals(r.indexOf('z'), undefined);
  });
});

Deno.test('InfinitRect', async (t) => {
  await t.step('create', () => {
    const ir = new InfiniteRect([[1, 2], [3, 4]]);
    assertEquals(ir.min, new Point(0, 0));
    assertEquals(ir.max, new Point(2, 2));
    assert(ir.check(new Point(100, 1000)));
    assertEquals(ir.get(new Point(3, 3)), 4);
    ir.set(4, 4, 9);
    assertEquals(ir.max.x, 4);
    assertEquals(ir.max.y, 4);
    ir.set(new Point(-1, 0), 8);
    assertEquals(ir.min.x, -1);
  });

  await t.step('slice', () => {
    const ir = new InfiniteRect([
      'abc'.split(''),
      'def'.split(''),
    ]);
    const s = ir.slice(new Point(0, 0), new Point(1, 1));
    assertEquals(Deno.inspect(s), 'ab\nde');
  });
});

Deno.test('PointSet', async (t) => {
  await t.step('create', () => {
    let p = new PointSet();
    assertEquals(p.size, 0);
    p = new PointSet(null);
    assertEquals(p.size, 0);
    p = new PointSet(undefined);
    assertEquals(p.size, 0);
    p = new PointSet([]);
    assertEquals(p.size, 0);
    p = new PointSet([new Point(1, 1)]);
    assertEquals(p.size, 1);
  });

  await t.step('add/delete', () => {
    const p = new Point(1, 1);
    const s = new PointSet();
    assertEquals(s.size, 0);
    s.add(p);
    assertEquals(s.size, 1);
    s.add(p);
    assertEquals(s.size, 1);
    s.delete(p);
    assertEquals(s.size, 0);
    s.add(p);
    assertEquals(s.size, 1);
    s.clear();
    assertEquals(s.size, 0);
  });

  await t.step('forEach', () => {
    const s = new PointSet();
    for (let x = 0; x < 10; x++) {
      s.add(new Point(x, 0));
    }
    assertEquals(s.size, 10);
    const boo = {};
    s.forEach(function (p): void {
      assertEquals(p.constructor.name, 'Point');
      // @ts-expect-error Shadowed this
      assertEquals(this, boo);
    }, boo);

    assert(s.has(new Point(5, 0)));

    let count = 0;
    for (const _p of s) {
      count++;
    }
    assertEquals(count, 10);

    count = 0;
    for (const [_p] of s.entries()) {
      count++;
    }
    assertEquals(count, 10);

    count = 0;
    for (const _p of s.keys()) {
      count++;
    }
    assertEquals(count, 10);

    count = 0;
    for (const _p of s.values()) {
      count++;
    }
    assertEquals(count, 10);
  });

  await t.step('union', () => {
    const a = new PointSet([
      new Point(0, 0),
      new Point(0, 2),
      new Point(0, 3),
      new Point(0, 4),
    ]);
    const b = new PointSet([
      new Point(0, 1),
      new Point(0, 3),
      new Point(0, 5),
    ]);
    assert(new PointSet(null));
    const u = a.union(b);
    assertEquals(u.size, 6);
    const i = a.intersection(b);
    assertEquals(i.size, 1);
    const d = a.difference(b);
    assertEquals(d.size, 3);
    const s = a.symmetricDifference(b);
    assertEquals(s.size, 5);
    assertFalse(a.isSubsetOf(b));
    assertFalse(a.isSupersetOf(b));
    assertFalse(a.isDisjointFrom(b));
  });

  await t.step('customInspect', () => {
    const a = new PointSet([
      new Point(0, 0),
      new Point(0, 2),
      new Point(0, 3),
      new Point(0, 4),
    ]);
    // @ts-expect-error No type info available
    const s = a[Symbol.for('Deno.customInspect')]();
    assertEquals(s, 'PointSet(4) { [0,0], [0,2], [0,3], [0,4] }');
  });
});
