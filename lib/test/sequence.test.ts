import { NumberSequence, Sequence } from '../sequence.ts';
import { assert, assertEquals, assertFalse, assertThrows } from '@std/assert';

Deno.test('Sequence', async (t) => {
  await t.step('isIterable', () => {
    assert(Sequence.isIterable([]));
    assertFalse(Sequence.isIterable({}));
  });

  await t.step('isSequence', () => {
    assert(Sequence.isSequence(Sequence.range(Infinity)));
    assertFalse(Sequence.isSequence(null));
    assertFalse(Sequence.isSequence({}));
    assertFalse(Sequence.isSequence(1));
  });

  await t.step('equal', () => {
    assert(Sequence.equal(new Sequence([1, 2]), new Sequence([1, 2])));
    assertFalse(Sequence.equal(new Sequence([1, 2]), new Sequence([1, 3])));
    assertFalse(Sequence.equal(new Sequence([1, 2]), new Sequence([1])));
    assertFalse(Sequence.equal(new Sequence([1]), new Sequence([1, 3])));
    const s = new Sequence([1, 2]);
    assert(Sequence.equal(s, s));
  });

  await t.step('factorial', () => {
    assertEquals([...Sequence.factorial().take(5)], [1, 1, 2, 6, 24]);
  });

  await t.step('forEver', () => {
    assertEquals(Sequence.forEver('and ever').take(4).toArray(), [
      'and ever',
      'and ever',
      'and ever',
      'and ever',
    ]);
  });

  await t.step('once', () => {
    assertEquals(Sequence.once('stop').toArray(), ['stop']);
  });

  await t.step('product', () => {
    assertEquals(
      Sequence.product([new Sequence('AB')], 2).map((a) => a.join(''))
        .toArray(),
      ['AA', 'AB', 'BA', 'BB'],
    );
    assertEquals(
      Sequence.product([new Sequence('AB'), new Sequence('CD')]).map((a) =>
        a.join('')
      ).toArray(),
      ['AC', 'AD', 'BC', 'BD'],
    );
  });

  await t.step('range', () => {
    const seen = [];
    for (const x of Sequence.range(4)) {
      seen.push(x);
    }
    assertEquals(seen, [0, 1, 2, 3]);
    assertEquals([...Sequence.range(4, 0, -1)], [4, 3, 2, 1]);
    assertEquals(Sequence.range(0, 10, 2).count(), 5);
    assertEquals(Sequence.range(3, 10, 3).count(), 3);
    assertEquals(Sequence.range(10, 3, -3).count(), 3);
    assertEquals(Sequence.range(10, 3).count(), 0);
  });

  await t.step('rangeI', () => {
    const seen = [];
    for (const x of Sequence.rangeI(4)) {
      seen.push(x);
    }
    assertEquals(seen, [0, 1, 2, 3, 4]);
    assertEquals([...Sequence.rangeI(4, 0, -1)], [4, 3, 2, 1, 0]);
  });

  await t.step('zip', () => {
    assertEquals(
      [...Sequence.zip(Sequence.range(3), Sequence.range(4, 7))],
      [[0, 4], [1, 5], [2, 6]],
    );
    assertEquals(
      [...Sequence.zip(Sequence.range(3), new Sequence([]))],
      [],
    );
  });

  await t.step('at', () => {
    assertEquals(Sequence.range(Infinity).at(4), 4);
    assertEquals(Sequence.range(4).at(5), undefined);
  });

  await t.step('chunks', () => {
    const s = Sequence.range(10);
    assertThrows(() => s.chunks(0), RangeError);
    assertThrows(() => s.chunks(0.5), RangeError);
    assertThrows(() => s.chunks(-1), RangeError);
    assertEquals([...s.chunks(5)], [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]]);
    assertEquals([...s.chunks(3)], [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
    assertEquals([...s.chunks(3.5)], [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
  });

  await t.step('combinations', () => {
    assertEquals([...Sequence.range(3).combinations(5)], []);
    assertEquals(
      [...Sequence.range(3).combinations(2)],
      [[0, 1], [0, 2], [1, 2]],
    );
  });

  await t.step('concat', () => {
    assertEquals(
      Sequence.range(5).concat(Sequence.range(2)).toArray(),
      [0, 1, 2, 3, 4, 0, 1],
    );
    assertEquals(
      Sequence.concat(Sequence.range(2), Sequence.range(3)).toArray(),
      [0, 1, 0, 1, 2],
    );
  });

  await t.step('count', () => {
    assertEquals(new Sequence([]).count(), 0);
    assertEquals(new Sequence([1]).count(), 1);
    assertEquals(Sequence.range(100).count(), 100);
    assertEquals(new Sequence(new Set()).count(), 0);
    assertEquals(new Sequence(new Set([1])).count(), 1);
    assertEquals(new Sequence(new Map([])).count(), 0);
    assertEquals(new Sequence(new Map([[1, 2]])).count(), 1);
  });

  await t.step('dedup', () => {
    assertEquals(new Sequence([1, 2, 2, 3, 2]).dedup().toArray(), [
      1,
      2,
      3,
      2,
    ]);
    assertEquals(
      new Sequence('ABbCb').dedup(
        (a, b) =>
          a.toUpperCase() === ((typeof b === 'symbol') ? b : b.toUpperCase()),
      ).join(''),
      'ABCb',
    );
  });

  await t.step('discard', () => {
    assertEquals(Sequence.range(5).discard(3).toArray(), [3, 4]);
  });

  await t.step('indexed', () => {
    const s = new Sequence('abc');
    assertEquals([...s.indexed()], [[0, 'a'], [1, 'b'], [2, 'c']]);
  });

  await t.step('every', () => {
    assertEquals(
      new Sequence('abc').every((i) => i === i.toLowerCase()),
      true,
    );
    assertEquals(
      new Sequence('aBc').every((i) => i === i.toLowerCase()),
      false,
    );
  });

  await t.step('find', () => {
    assertEquals(Sequence.range(5).find((i) => i % 2 === 1), 1);
    assertEquals(Sequence.range(5).find((i) => i === 10), undefined);
  });

  await t.step('findIndex', () => {
    assertEquals(
      new Sequence('aBc').findIndex((i) => i.toUpperCase() === i),
      1,
    );
    assertEquals(Sequence.range(5).findIndex((i) => i === 10), -1);
  });

  await t.step('filter', () => {
    assertEquals(
      Sequence.range(0, 10000).take(10).filter((t) => t % 2 !== 0).toArray(),
      [1, 3, 5, 7, 9],
    );
  });

  await t.step('first', () => {
    assertEquals(Sequence.range(Infinity).first(), 0);
    assertEquals(new Sequence([]).first(), undefined);
  });

  await t.step('flat', () => {
    const s = new Sequence([1, [2, 3], [4, [5, 6]]]);
    assertEquals([...s.flat()], [1, 2, 3, 4, [5, 6]]);
    assertEquals([...s.flat(Infinity)], [1, 2, 3, 4, 5, 6]);
  });

  await t.step('flatMap', () => {
    const s = new Sequence([1, [2, 3]]);
    assertEquals([...s.flatMap((x) => Array.isArray(x) ? x : -x)], [
      -1,
      2,
      3,
    ]);
  });

  await t.step('forEach', () => {
    const res: number[][] = [];
    const seq = Sequence.range(1, 5);
    const that = Symbol('that');
    seq.forEach(function (item, index, s): void {
      assertEquals(seq, s as NumberSequence);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore this is an alias
      assertEquals(this as unknown, that);
      res.push([item, index]);
    }, that);
    assertEquals(res, [
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 3],
    ]);
  });

  await t.step('groupBy', () => {
    assertEquals(
      [...new Sequence([1, 1, 1, 3, 3, 2, 2, 2]).groupBy((a, b) => a === b)],
      [[1, 1, 1], [3, 3], [2, 2, 2]],
    );
    assertEquals(
      [...new Sequence([1, 1, 2, 3, 2, 3, 2, 3, 4]).groupBy((a, b) => a <= b)],
      [[1, 1, 2, 3], [2, 3], [2, 3, 4]],
    );
  });

  await t.step('isEmpty', () => {
    assert(new Sequence([]).isEmpty());
    assertFalse(new Sequence([1]).isEmpty());
  });

  await t.step('isSorted', () => {
    assert(Sequence.range(4).isSorted());
    assert(new Sequence([1, 1, 2, 3]).isSorted());
    assertFalse(
      new Sequence(['aaa', 'a']).isSorted((a, b) => a.length <= b.length),
    );
  });

  await t.step('last', () => {
    assertEquals(new Sequence([]).last(), undefined);
    assertEquals(new Sequence([1, 2, 3]).last(), 3);
  });

  await t.step('histogram', () => {
    const r = Sequence.range(0, 4).ncycle(5);
    assertEquals(r.histogram(), {
      0: 5,
      1: 5,
      2: 5,
      3: 5,
    });
  });

  await t.step('ncycle', () => {
    assertEquals([...new Sequence('AB').ncycle(0)], []);
    assertEquals([...new Sequence('AB').ncycle(1)], ['A', 'B']);
    assertEquals([...new Sequence('AB').ncycle(2)], ['A', 'B', 'A', 'B']);
    assertEquals([...new Sequence([]).ncycle(2)], []);
  });

  await t.step('permutations', () => {
    assertEquals(
      new Sequence('ABCD').permutations(2).map((a) => a.join('')).toArray(),
      [
        'AB',
        'AC',
        'AD',
        'BA',
        'BC',
        'BD',
        'CA',
        'CB',
        'CD',
        'DA',
        'DB',
        'DC',
      ],
    );
    assertEquals(new Sequence([]).permutations(1).toArray(), []);
    assertEquals(Sequence.range(3).permutations(0).toArray(), []);
    assertEquals(Sequence.range(3).permutations(5).toArray(), []);
    assertEquals(Sequence.range(3).permutations(-5).toArray(), []);
  });

  await t.step('pick', () => {
    assert(
      Sequence.equal(Sequence.range(4).pick([1, 3]), new Sequence([1, 3])),
    );
  });

  await t.step('powerset', () => {
    assertEquals(
      new Sequence('ABC').powerset().map((a) => a.join('')).toArray(),
      [
        '',
        'A',
        'B',
        'C',
        'AB',
        'AC',
        'BC',
        'ABC',
      ],
    );
  });

  await t.step('reduce', () => {
    assertEquals(Sequence.range(10).reduce<number>((t, x) => t + x), 45);
    assertEquals(Sequence.range(10).reduce<number>((t, x) => t + x, 1), 46);
    assertThrows(
      () => new Sequence([]).reduce(() => 0),
      Error,
      'Empty iterable and no initializer',
    );
  });

  await t.step('slice', () => {
    const s = Sequence.range(10);
    assertEquals([...s.slice()], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assertEquals([...s.slice(0, 0)], []);
    assertEquals([...s.slice(0, -1)], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    assertEquals([...s.slice(0, -12)], []);
    assertEquals([...s.slice(3, -1)], [3, 4, 5, 6, 7, 8]);
    assertEquals([...s.slice(12)], []);
    assertEquals([...s.slice(-12)], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assertEquals([...s.slice(-2)], [8, 9]);
    assertEquals([...s.slice(-2, -3)], []);
    assertEquals([...s.slice(-2, -13)], []);
    assertEquals([...s.slice(-2, -1)], [8]);
    assertEquals([...s.slice(-4, -1)], [6, 7, 8]);
    assertEquals([...s.slice(-4, 9)], [6, 7, 8]);
    assertEquals([...s.slice(-4, 12)], [6, 7, 8, 9]);
  });

  await t.step('some', () => {
    assert(Sequence.range(3).some((i) => (i % 2) !== 0));
    assertFalse(new Sequence([1, 3, 5]).some((i) => (i % 2) === 0));
    const u = {};

    // Has to be a "function", otherwise "this" gets mangled.
    function smallThis(this: object, _: number, i: number): boolean {
      return (i < 3) && (this === u);
    }

    assert(new Sequence([1, 3, 5]).some(smallThis, u));
  });

  await t.step('startWhen', () => {
    assertEquals([...Sequence.range(10).startWhen((x) => x > 7)], [8, 9]);
  });

  await t.step('take', () => {
    assertEquals([...Sequence.range(3).take(0)], []);
    assertEquals([...Sequence.range(3).take(3)], [0, 1, 2]);
    assertEquals([...Sequence.range(3).take(4)], [0, 1, 2]);
    assertEquals([...Sequence.range(10).take(3)], [0, 1, 2]);
    assertEquals([...Sequence.range(10).take(-3)], [0, 1, 2, 3, 4, 5, 6]);
  });

  await t.step('trunc', () => {
    assertEquals([...Sequence.range(3).trunc(0)], [0, 1, 2]);
    assertEquals([...Sequence.range(10).trunc(3)], [0, 1, 2, 3, 4, 5, 6]);
    assertEquals([...Sequence.range(3).trunc(-3)], [0, 1, 2]);
  });

  await t.step('until', () => {
    assertEquals(
      [...new Sequence('ABCD').until((x) => x === 'C')],
      ['A', 'B'],
    );
  });

  await t.step('windows', () => {
    assertEquals(
      [...new Sequence('ABCD').windows(2).map((i) => i.join(''))],
      ['AB', 'BC', 'CD'],
    );
    assertEquals(
      [...new Sequence([]).windows(2)],
      [],
    );
  });

  await t.step('NumberSequence', async (t) => {
    await t.step('avg', () => {
      assertEquals(Sequence.range(5).avg(), 2);
      assertEquals(new NumberSequence([]).avg(), NaN);
    });

    await t.step('cumulativeAvg', () => {
      assertEquals([...Sequence.range(5).cumulativeAvg()], [
        0,
        0.5,
        1,
        1.5,
        2,
      ]);
      assertEquals([...new NumberSequence([]).cumulativeAvg()], []);
    });

    await t.step('histogramArray', () => {
      const n = new NumberSequence([1, 2, 2, 3]);
      // deno-lint-ignore no-sparse-arrays
      assertEquals(n.histogramArray(), [, 1, 2, 1]);
      const o = new NumberSequence([NaN]);
      assertThrows(() => o.histogramArray());
    });

    //
    //   await t.step("random", t => {
    //   assertThrows(() => Sequence.random({ fn: 4 } as any), { instanceOf: TypeError });
    //   assertThrows(() => Sequence.random({
    //     min: "A", integer: true, fn: (a: number, b: number) => a + b
    //   } as any).first(), { instanceOf: TypeError });
    //   assertThrows(() => Sequence.random({
    //     max: "A", integer: true, fn: (a: number, b: number) => a + b
    //   } as any).first(), { instanceOf: TypeError });

    //   assertThrows(() => Sequence.random({
    //     min: "A", integer: true, fn: () => 0
    //   } as any).first(), { instanceOf: TypeError });
    //   assertThrows(() => Sequence.random({
    //     max: "A", integer: true, fn: () => 0
    //   } as any).first(), { instanceOf: TypeError });
    //   assertThrows(() => Sequence.random({
    //     fn: (a: number) => a,
    //     integer: true,
    //   } as any).first(), { instanceOf: TypeError });

    //   assert(Sequence.random({
    //     min: 3, max: 10, integer: true, fn: crypto.randomInt
    //   }).take(1000).every(v => (v | 0) === v && v >= 3 && v < 10));
    //   assert(Sequence.random({
    //     min: -1, max: 2, integer: true, fn: crypto.randomInt
    //   }).take(1000).every(v => (v | 0) === v && v >= -1 && v < 2));
    //   assert(Sequence.random({
    //     min: 3, max: 10, integer: true
    //   }).take(1000).every(v => (v | 0) === v && v >= 3 && v < 10));
    //   assert(Sequence.random().take(1000).every(v => v >= 0 && v < 1));
    // });

    await t.step('sum', () => {
      assertEquals(Sequence.range(10).sum(), 45);
    });

    await t.step('nproduct', () => {
      assertEquals(new NumberSequence([3, 7, 9]).product(), 189);
    });

    await t.step('cumulativeStdev', () => {
      // Inputs from the output of random(), bucketized.
      const n = new NumberSequence([
        99753,
        99844,
        100312,
        99825,
        99816,
        100140,
        100256,
        99969,
        100396,
        99689,
      ]);
      const c = n.cumulativeStdev().map((n) => Math.round(n)).toArray();
      // I calculated this in google sheets with stdevp().
      assertEquals(c, [0, 46, 245, 221, 203, 204, 218, 204, 231, 242]);
      const o = new NumberSequence([]);
      assertEquals([...o.cumulativeStdev()], []);
    });

    await t.step('stdev', () => {
      // Inputs from the output of random(), bucketized.
      const n = new NumberSequence([
        99753,
        99844,
        100312,
        99825,
        99816,
        100140,
        100256,
        99969,
        100396,
        99689,
      ]);
      // Yeah, yeah, I know.  Float===.
      // I calculated this in google sheets with stdevp().
      assertEquals(n.stdev(), 242.2403764858371);
    });
  });
});
