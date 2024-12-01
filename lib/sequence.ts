/* eslint-disable @typescript-eslint/no-this-alias */

import { Counter } from './counter.ts';

//
// type minMaxFun = (min: number, max: number) => number;
// type randFun = () => number;
// type eitherRand = minMaxFun | randFun;

// function isMinMaxFun(fn: any): fn is minMaxFun {
//   return (typeof fn === "function") && (fn.length > 1);
// }
// function isRandFun(fn: any): fn is randFun {
//   return (typeof fn === "function") && (fn.length === 0);
// }

// interface RandomProps {
//   min?: number;
//   max?: number;
//   integer?: boolean;
//   fn?: eitherRand;
// }
// const RAND_MAX = 0xFFFFFFFFFFFF;

/**
 * Are the two items equal?
 *
 * @param a - Current item
 * @param b - Previous item
 * @returns True if equal
 */
type equalityCallback<T> = (a: T, b: T) => boolean;
function eqeqeq<T>(a: T, b: T): boolean {
  return a === b;
}
function ordered<T>(a: T, b: T): boolean {
  return a <= b;
}

/**
 * @param item - The item of the iterator to map
 * @param index - The index of the item in the iterator
 * @param sequence - The sequence being mapped
 * @returns The mapped value
 */
type flatMapCallback<T, U> = (
  item: T,
  index: number,
  sequence: Sequence<T>,
) => U | Iterable<U>;

/**
 * @param item - The item of the iterator to filter.
 * @param index - The index of the item in the iterator.
 * @param sequence - The iterable being filtered.
 * @returns If true, this item is retained.
 */
type filterCallback<T> = (
  item: T,
  index: number,
  sequence: Sequence<T>,
) => boolean;

/**
 * @param item - The item of the iterator to map
 * @param index - The index of the item in the iterator
 * @param sequence - The sequence being mapped
 * @returns The mapped value
 */
type mapCallback<T, U> = (item: T, index: number, sequence: Sequence<T>) => U;

/**
 * @param accumulator - The value previously returned from the
 *   callback, starting with the initializer
 * @param item - The item of the iterator to process
 * @param index - The index of the item in the iterator
 * @returns The next value of the accumulator
 */
type reduceCallback<T, A> = (
  accumulator: A,
  item: T,
  index: number,
  sequence: Sequence<T>,
) => A;

/**
 * @param item - The item of the iterator to process
 * @param index - The index of the item in the iterator
 * @param sequence - The sequence being iterated
 */
type forEachCallback<T> = (
  item: T,
  index: number,
  sequence: Sequence<T>,
) => void;

/**
 * Lazy sequences, based on generators and iterators.
 *
 * The more interesting functions were lifted from lifted from
 * https://github.com/aureooms/js-itertools, to translate to TS
 * and avoid the need for a runtime.
 */
export class Sequence<T> {
  it: Iterable<T>;

  #length?: number;

  /**
   * Creates an instance of Sequence.
   *
   * @param iterable - The iterable to wrap.
   */
  constructor(iterable: Iterable<T>, len?: number) {
    this.it = iterable;
    if (len !== undefined) {
      this.#length = len;
    }
  }

  //#region Type Checking
  /**
   * Is the given thing iterable?
   *
   * @param g - The thing to check.
   * @returns True if `g` looks like an iterable.
   */
  static isIterable<T>(g: unknown): g is Iterable<T> {
    return Boolean(g) &&
      (typeof g === 'object') &&
      (typeof (g as Iterable<T>)[Symbol.iterator] === 'function');
  }

  /**
   * Is this thing a sequence?
   *
   * @param s - Something that might be a Sequence
   * @returns True if it's a Sequence
   */
  static isSequence<T>(s: unknown): s is Sequence<T> {
    return Boolean(s) &&
      (typeof s === 'object') &&
      (s instanceof Sequence);
  }
  //#endregion Type Checking

  //#region Statics

  /**
   * Concatenate several sequences together.
   *
   * @param seqs - The input sequences
   * @returns A sequence with all of the items of each sequence in order.
   */
  static concat<T>(...seqs: Sequence<T>[]): Sequence<T> {
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        for (const s of seqs) {
          yield* s;
        }
      },
    });
  }

  /**
   * Are two sequences equal?  They are if all of their members are `===`.
   *
   * @param a - First Sequence.
   * @param b - Second Sequence.
   * @returns True if sequences are equal.
   */
  static equal<U>(a: Sequence<U>, b: Sequence<U>): boolean {
    if (a === b) {
      return true;
    }

    const itA = a[Symbol.iterator]();
    const itB = b[Symbol.iterator]();

    let ret = true;
    while (ret) {
      const nA = itA.next();
      const nB = itB.next();
      ret = (nA.done === nB.done) && (nA.value === nB.value);
      if (nA.done || nB.done) {
        break;
      }
    }
    return ret;
  }

  /**
   * 1, 1, 2, 6...
   *
   * @returns Factorial sequence
   */
  static factorial(): NumberSequence {
    return new NumberSequence({
      *[Symbol.iterator](): Generator<number, void, undefined> {
        let count = 1;
        let total = 1;
        while (true) {
          yield total;
          total *= count++;
        }
      },
    });
  }

  /**
   * Yield the same value for ever.  And ever.
   * Value of VALUES! And Loop of LOOPS!
   *
   * @param val - The value to yield.
   * @returns A Sequence yielding val forever.
   */
  static forEver<U>(val: U): Sequence<U> {
    return new Sequence({
      *[Symbol.iterator](): Generator<U, void, undefined> {
        while (true) {
          yield val;
        }
      },
    });
  }

  /**
   * A sequence that yields the given value exactly once.
   *
   * @param val - The value to yield
   * @returns A sequence of just val.
   */
  static once<U>(val: U): Sequence<U> {
    return new Sequence({
      *[Symbol.iterator](): Generator<U, void, undefined> {
        yield val;
      },
    });
  }

  /**
   * Cross product.  Translated from the python docs.
   *
   * @param seqs - Sequences to cross together.
   * @param repeat - Number of times to repeat the iterables.
   * @returns A generator yielding each of the combinations of the iterables.
   */
  static product<U>(seqs: Sequence<U>[], repeat = 1): Sequence<U[]> {
    return new Sequence({
      *[Symbol.iterator](): Generator<U[], void, undefined> {
        const aseqs: U[][] = seqs.map<U[]>((s) => s.toArray());
        const pools = new Sequence(aseqs).ncycle(repeat);
        let result: U[][] = [[]];
        for (const pool of pools) {
          const r2: U[][] = [];
          for (const x of result) {
            for (const y of pool) {
              r2.push([...x, y]);
            }
            result = r2;
          }
        }
        yield* result;
      },
    });
  }

  //
  // static random(props: RandomProps = {}): NumberSequence {
  //   props = {
  //     min: 0,
  //     max: 1,
  //     integer: false,
  //     fn: Math.random,
  //     ...props,
  //   };
  //   if (typeof props.fn !== "function") {
  //     throw new TypeError("fn must be function");
  //   }
  //   if (props.integer) {

  //   } else {
  //     // Get real

  //     // Special case (0,1]
  //     if (props.min === 0 && props.max === 1 && isRandFun(props.fn)) {
  //       return new NumberSequence({
  //         * [Symbol.iterator]() {
  //           if (!isRandFun(props.fn)) {
  //             throw new TypeError("Impossible function type");
  //           }
  //           while (true) {
  //             yield props.fn();
  //           }
  //         }
  //       });
  //     } else {
  //       // This is likely biased, but care about that later.
  //       return new NumberSequence({
  //         * [Symbol.iterator]() {
  //           if (!isRandFun(props.fn)) {
  //             throw new TypeError("Impossible function type");
  //           }
  //           if (typeof props.min !== "number") {
  //             throw new TypeError("min must be number or unspecified");
  //           }
  //           if (typeof props.max !== "number") {
  //             throw new TypeError("max must be number or unspecified");
  //           }

  //           const range = props.max - props.min;
  //           while (true) {
  //             yield (props.fn() * range) + props.min;
  //           }
  //         }
  //       });
  //     }
  //   }
  // }

  // static randomInt(
  //   minMaxFn?: number | randFun | minMaxFun,
  //   maxFn?: number | randFun | minMaxFun,
  //   fn?: randFun | minMaxFun
  // ) {
  //   let min = 0;
  //   let cb: eitherRand;
  //   switch (typeof minMaxFn) {
  //     case "object":
  //       if (!minMaxFn) {
  //         throw new TypeError("")
  //       }
  //     case "undefined":
  //       break;
  //     case "function":
  //       cb = minMaxFn;
  //       break;
  //     default:
  //       throw new TypeError()
  //   }
  //   if (isMinMaxFun(minMaxFn) || isRandFun(minMaxFn)) {
  //     cb = minMaxFn;
  //   } else if (isMinMaxFun(minMaxFn) || isRandFun(minMaxFn))
  //   props = {
  //     min: 0,
  //     max: 1,
  //     fn: Math.random,
  //     ...props,
  //   };
  //   if (typeof props.fn !== "function") {
  //     throw new TypeError("fn must be function");
  //   }
  //   if (props.fn.length > 1) {
  //     // Probably crypto.randomInt
  //     return new NumberSequence({
  //       * [Symbol.iterator]() {
  //         // Type guards didn't propagate
  //         if (!isMinMaxFun(props.fn)) {
  //           /* c8 ignore next */
  //           throw new TypeError("fn must be function or unspecified");
  //           /* c8 ignore next */
  //         }
  //         if (typeof props.min !== "number") {
  //           throw new TypeError("min must be number or unspecified");
  //         }
  //         if (typeof props.max !== "number") {
  //           throw new TypeError("max must be number or unspecified");
  //         }

  //         while (true) {
  //           yield props.fn(props.min, props.max);
  //         }
  //       }
  //     });
  //   } else {
  //     return new NumberSequence({
  //       * [Symbol.iterator]() {
  //         // Type guards didn't propagate
  //         if (!isRandFun(props.fn)) {
  //           throw new TypeError("fn must be function or unspecified");
  //         }
  //         if (typeof props.min !== "number") {
  //           throw new TypeError("min must be number or unspecified");
  //         }
  //         if (typeof props.max !== "number") {
  //           throw new TypeError("max must be number or unspecified");
  //         }

  //         // You really should have used crypto.randomInt
  //         // De-bias as much as we can.
  //         // Note: rand()*(2 ** x) should be uniform
  //         const range = props.max - props.min;
  //         const range2 = 1 << Math.ceil(Math.log2(range));
  //         const limit = range2 - (range2 % range);
  //         while (true) {
  //           const x = Math.floor(props.fn() * range2);
  //           if (x < limit) {
  //             yield (x % range) + props.min;
  //           }
  //         }
  //       }
  //     });
  //   }
  // }

  /**
   * Like Python's range(), generate a series of numbers.
   *
   * @param start - The starting point
   * @param stop - The ending point, which isn't reached
   * @param step - How much to add each time, may be negative
   * @returns A sequence that yields each number in the range
   */
  static range(start: number, stop?: number, step = 1): NumberSequence {
    if (stop === undefined) {
      [start, stop] = [0, start];
    }
    const count = Math.ceil((stop - start) / step);
    return new NumberSequence({
      *[Symbol.iterator](): Generator<number, void, undefined> {
        if (step < 0) {
          for (let i = start; i > stop!; i += step) {
            yield i;
          }
        } else {
          for (let i = start; i < stop!; i += step) {
            yield i;
          }
        }
      },
    }, count < 0 ? 0 : count);
  }

  /**
   * Like Python's range(), generate a series of numbers, *inclusive*
   * of the ending point.
   *
   * @param start - The starting point
   * @param stop - The ending point, which is reached
   * @param step - How much to add each time, may be negative
   * @returns A sequence that yields each number in the range
   */
  static rangeI(start: number, stop?: number, step = 1): NumberSequence {
    return new NumberSequence({
      *[Symbol.iterator](): Generator<number, void, undefined> {
        if (stop === undefined) {
          [start, stop] = [0, start];
        }
        if (step < 0) {
          for (let i = start; i >= stop; i += step) {
            yield i;
          }
        } else {
          for (let i = start; i <= stop; i += step) {
            yield i;
          }
        }
      },
    });
  }

  /**
   * Tie together multiple sequences into a sequence of an array of the first
   * item from each sequence, the second item from each sequence, etc.
   *
   * @param seqs - The sequences to zip together
   * @returns [s[0][0], s[1][0]], [s[0][1], s[1][1]], ...
   */
  static zip<T>(...seqs: (Sequence<T> | Iterable<T>)[]): Sequence<T[]> {
    return new Sequence({
      *[Symbol.iterator](): Generator<T[], void, undefined> {
        const its = seqs.map((s) => s[Symbol.iterator]());
        while (true) {
          const nexts = its.map((i) => i.next());
          if (nexts.some((n) => n.done)) {
            return;
          }
          yield nexts.map((n) => n.value);
        }
      },
    });
  }

  //#endregion Statics

  //#region Methods

  /**
   * Allow iteration over a Sequence.
   *
   * @returns Iterator instance.
   */
  [Symbol.iterator](): Iterator<T, void, undefined> {
    return this.it[Symbol.iterator]();
  }

  /**
   * Return the Nth item of the sequence.
   *
   * @param n - Zero-based
   * @returns The Nth item, or undefined if sequence isn't long enough
   */
  at(n: number): T | undefined {
    let count = 0;
    for (const i of this.it) {
      if (count === n) {
        return i;
      }
      count++;
    }
    return undefined;
  }

  /**
   * Generate chunks of n items throughout the sequence.  If the sequence
   * length is not divisible by n, the last chunk will be of length greater
   * than zero but less than n.
   *
   * @param n - Size of each chunk
   * @returns Sequence of arrays of items
   */
  chunks(n: number): Sequence<T[]> {
    n |= 0;
    if (n < 1) {
      throw new RangeError('n must be greater than one');
    }
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T[], void, undefined> {
        let res = new Array(n);
        let count = 0;
        for (const i of that.it) {
          res[count] = i;
          if (count === n - 1) {
            yield res;
            res = new Array(n);
            count = 0;
          } else {
            count++;
          }
        }
        // Anything left?
        if (count > 0) {
          res.splice(count);
          yield res;
        }
      },
    });
  }

  /**
   * Combinations of a series, r at a time
   *
   * @param r - How many of the series to use in each combination?
   * @returns A generator that yields each combination
   */
  combinations(r: number): Sequence<T[]> {
    const pool = this.toArraySequence();
    return new Sequence({
      *[Symbol.iterator](): Generator<T[], void, undefined> {
        const length = pool.count();

        if (r > length) {
          return;
        }

        const indices = [...Sequence.range(r)];
        yield [...pool.pick(indices)];

        while (true) {
          let i = r - 1;
          while (i >= 0) {
            if (indices[i] !== i + length - r) {
              let pivot = ++indices[i];
              for (++i; i < r; ++i) {
                indices[i] = ++pivot;
              }
              break;
            }
            i--;
          }

          if (i < 0) {
            return;
          }

          yield [...pool.pick(indices)];
        }
      },
    });
  }

  /**
   * Concatenate this sequence follwed by all of the input sequences.
   *
   * @param seqs - The other sequences
   * @returns A sequence with all of the items of each sequence in order,
   *   starting with this sequence.
   */
  concat(...seqs: Sequence<T>[]): Sequence<T> {
    return Sequence.concat(this, ...seqs);
  }

  /**
   * Return the number of items in the sequence.  Optimizations for arrays,
   * sets, and maps.
   *
   * @returns The number of items.
   */
  count(): number {
    if (this.#length !== undefined) {
      return this.#length;
    }
    if (Array.isArray(this.it)) {
      return this.it.length;
    }
    if (this.it instanceof Map || this.it instanceof Set) {
      return this.it.size;
    }

    let count = 0;
    for (const _ of this.it) {
      count++;
    }
    return count;
  }

  /**
   * Removes all but the first of consecutive elements in the vector
   * satisfying a given equality relation.
   *
   * @param fn - The equality relation, defaults to ===.
   * @returns Deduplicated sequence
   */
  dedup(fn: equalityCallback<T> = eqeqeq): Sequence<T> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        let first = true;
        let last;
        for (const i of that.it) {
          if (first) {
            first = false;
            yield i;
            last = i;
          } else if (!fn(i, last as T)) {
            yield i;
            last = i;
          }
        }
      },
    });
  }

  /**
   * Discard the first size elements of the sequence, and return an Sequence
   * with everything else.
   *
   * @param size - The number of elements to discard.
   * @returns A new Sequence
   */
  discard(size: number): Sequence<T> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      [Symbol.iterator](): Iterator<T, void, undefined> {
        const it = that.it[Symbol.iterator]();
        for (let i = 0; i < size; i++) {
          it.next();
        }
        return it;
      },
    });
  }

  /**
   * Creates a new sequence with the key/value pairs of the original sequence.
   *
   * @returns Sequence of [number, item] tuples
   */
  indexed(): Sequence<[number, T]> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<[number, T], void, undefined> {
        let count = 0;
        for (const i of that.it) {
          yield [count++, i];
        }
      },
    });
  }

  /**
   * Does every item in the sequence fulfill some predicate?
   *
   * @param fn - The predictate
   * @param thisArg - Optional "this" for the predicate
   * @returns True if the predicate matches for all items
   */
  every(fn: filterCallback<T>, thisArg?: unknown): boolean {
    let count = 0;
    for (const i of this.it) {
      if (!fn.call(thisArg, i, count++, this)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Call a function for every item in the sequence.
   *
   * @param fn - The function
   * @param thisArg - Optional argument to be `this` in the function.
   */
  forEach(fn: forEachCallback<T>, thisArg?: unknown): void {
    let count = 0;
    for (const i of this.it) {
      fn.call(thisArg, i, count++, this);
    }
  }

  /**
   * Filter the iterable by a function.  If the function returns true,
   * the given value is yielded.  This should be a pretty big win over
   * `[...iterable].filter(fn)`.
   *
   * @param fn - Function called for every item in iterable.
   * @param thisArg - Value to use as `this` in the filterCallback.
   * @returns A generator that yields iterable values that match.
   */
  filter(fn: filterCallback<T>, thisArg?: unknown): Sequence<T> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        let count = 0;
        for (const val of that.it) {
          if (fn.call(thisArg, val, count++, that)) {
            yield val;
          }
        }
      },
    });
  }

  /**
   * Return the first item of the sequence for which the function returns
   * true.
   *
   * @param fn - Function to call on each argument.
   * @param thisArg - Object to use as "this" in the callback function.
   * @returns The first match, or undefined.
   */
  find(fn: filterCallback<T>, thisArg?: unknown): T | undefined {
    let count = 0;
    for (const val of this.it) {
      if (fn.call(thisArg, val, count++, this)) {
        return val;
      }
    }
    return undefined;
  }

  /**
   * Find the index into the sequence for the first item that matches the
   * predicate.
   *
   * @param fn - Predicate to call on each argument.
   * @param thisArg - Object to use as "this" in the callback function.
   * @returns The index of the first match, or -1 if not found.
   */
  findIndex(fn: filterCallback<T>, thisArg?: unknown): number {
    let count = 0;
    for (const val of this.it) {
      if (fn.call(thisArg, val, count, this)) {
        return count;
      }
      count++;
    }
    return -1;
  }

  /**
   * Get the first item of the sequence, if it isn't empty.
   *
   * @returns The first item, or undefined if the sequence is empty.
   */
  first(): T | undefined {
    for (const i of this.it) {
      return i;
    }
    return undefined;
  }

  /**
   * Flatten the Sequence by up to depth times.  For this to make sense,
   * T must be at least sometimes-iterable (e.g. number|number[]).
   *
   * @param depth - Maximum depth to flatten.  Infinity is a valid option.
   * @returns A flattened sequence.
   */
  flat(depth = 1): Sequence<T> {
    function* f(s: Iterable<T>, d: number): Generator<T, void, undefined> {
      for (const i of s) {
        if ((d < depth) && Sequence.isIterable<T>(i)) {
          yield* f(i, d + 1);
        } else {
          yield i;
        }
      }
    }

    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        yield* f(that.it, 0);
      },
    });
  }

  /**
   * Perform a map operation on the sequence, then flatten once.
   *
   * @param fn - Map from T to U or Iterable[U]
   * @param thisArg - "this" in the mapping function
   * @returns - A new sequence, with the mapped and flattend values.
   */
  flatMap<U>(fn: flatMapCallback<T, U>, thisArg?: unknown): Sequence<U> {
    // Map, then flatten.
    // Always pillage before you burn.
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<U, void, undefined> {
        let c = 0;
        for (const item of that.it) {
          // Flatten to depth 1
          const res = fn.call(thisArg, item, c++, that);
          if (Sequence.isIterable(res)) {
            yield* res;
          } else {
            yield res;
          }
        }
      },
    });
  }

  /**
   * Does the sequence have at least one item?
   *
   * @returns True if empty
   */
  isEmpty(): boolean {
    for (const _ of this.it) {
      return false;
    }
    return true;
  }

  /**
   * Is the sequence sorted?  You may pass in a predicate that returns
   * true if its two parameters are in order.
   *
   * @param fn - Sorting predicate
   * @returns True if the entire sequence is sorted.
   */
  isSorted(fn: equalityCallback<T> = ordered): boolean {
    for (const [a, b] of this.windows(2)) {
      if (!fn(a, b)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Create a string from the sequence, interspersing each element with a
   * separator.  Note that this can be infinitely-expensive for inifinite
   * sequences.
   *
   * @param separator - Separate each item.  Use "" if you don't want one.
   * @returns The joined string
   */
  join(separator = ','): string {
    let res = '';
    let first = true;
    for (const i of this.it) {
      if (first) {
        first = false;
      } else {
        res += separator;
      }
      res += String(i);
    }
    return res;
  }

  /**
   * Create a sequence of arrays that are grouped by the given function.
   * As long as the function returns true, the elements will be grouped
   * together.
   *
   * @param fn - Grouping predicate, called with [0], [1] then [1], [2], etc.
   * @returns
   */
  groupBy(fn: equalityCallback<T> = eqeqeq<T>): Sequence<T[]> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T[], void, undefined> {
        let res: T[] = [];
        let first = true;
        for (const [a, b] of that.windows(2)) {
          if (first) {
            res.push(a);
            first = false;
          }
          if (fn(a, b)) {
            res.push(b);
          } else {
            yield res;
            res = [b];
          }
        }
        if (res.length > 0) {
          yield res;
        }
      },
    });
  }

  /**
   * Go all the way to the end of the sequence, and return the last item.
   *
   * @returns The last item of the sequence
   */
  last(): T | undefined {
    let prev = undefined;
    for (const i of this.it) {
      prev = i;
    }
    return prev;
  }

  /**
   * Generate a histogram object of all of the items in the sequence.  They
   * keys will be the stringified versions of the item.
   *
   * @returns Object with counts of each item.
   */
  histogram(): { [id: string]: number } {
    const counts = new Counter<T>().addAll(this.it);
    return counts.points;
  }

  /**
   * Map a function across all of the items in an iterable.
   *
   * @param callable - The mapping function
   * @param iterable - Source to map from
   * @param thisArg - Optional "this" inside of the callable
   * @returns A generator that yields the mapped values
   */
  map<U>(callable: mapCallback<T, U>, thisArg?: unknown): Sequence<U> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<U, void, undefined> {
        let c = 0;
        for (const item of that.it) {
          yield callable.call(thisArg, item, c++, that);
        }
      },
    });
  }

  /**
   * Cycle an iteable n times.
   *
   * @param n - The number of times to cycle through the input iterable
   * @returns A generator that yields each value from the iterable, cycled.
   */
  ncycle(n: number): Sequence<T> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        if (n <= 0) {
          // Nothing
        } else if (n === 1) {
          yield* that.it;
        } else {
          const buffer = [];
          for (const item of that.it) {
            yield item;
            buffer.push(item);
          }

          if (buffer.length === 0) {
            return;
          }

          while (--n > 0) {
            yield* buffer;
          }
        }
      },
    });
  }

  /**
   * Yields all permutations of each possible choice of <code>r</code> elements
   * of the input iterable.
   *
   * @param r - The size of the permutations to generate.
   * @returns A generator that yields each permutation.
   */
  permutations(r: number): Sequence<T[]> {
    const pool = this.toArraySequence();
    return new Sequence({
      *[Symbol.iterator](): Generator<T[], void, undefined> {
        const length = pool.count();

        if (r > length || r <= 0 || length === 0) {
          return;
        }

        const indices = [...Sequence.range(length)];
        const cycles = [...Sequence.range(length, length - r, -1)];

        yield [...pool.pick(indices.slice(0, r))];

        while (true) {
          let i = r;

          while (i--) {
            --cycles[i];

            if (cycles[i] === 0) {
              // Could be costly
              indices.push(indices.splice(i, 1)[0]);

              cycles[i] = length - i;
            } else {
              const j = cycles[i];
              [indices[i], indices[length - j]] = [
                indices[length - j],
                indices[i],
              ];
              yield [...pool.pick(indices.slice(0, r))];
              break;
            }
          }

          if (i === -1) {
            return;
          }
        }
      },
    });
  }

  /**
   * Pick some properties or array values out of `source`.
   *
   * @param it - The indexes
   * @returns A generator that yields the selected items
   */
  pick(it: Iterable<number>): Sequence<T> {
    const pool = this.toArray();
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        // This is slower than it should be, but `it` might be out
        // of order, and so might `source`.

        for (const i of it) {
          yield pool[i];
        }
      },
    });
  }

  /**
   * Yields all possible subsets of the input, including the input itself
   * and the empty set.
   *
   * @param iterable - Input.
   * @returns A generator yielding each subset.
   */
  powerset(): Sequence<T[]> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T[], void, undefined> {
        for (const len of Sequence.range(that.count() + 1)) {
          yield* that.combinations(len);
        }
      },
    });
  }

  /**
   * Repeatedly execute a reducer callback for each item in the iterable,
   * resulting in a single output value.
   *
   * @param callback - Function to call for each item in the iterable
   * @param iterable - Series to pull from
   * @param initializer - Initial value.  If none is provided, use the
   *   first item in the iterable (like `Array.prototype.reduce()`).
   * @returns The result of the last call to the callback on the
   *   last item
   * @throws {@link TypeError} Iterable is empty and there is no initializer
   */
  reduce<A>(callback: reduceCallback<T, A>, initializer?: A): A {
    // deno-lint-ignore no-this-alias
    let iterable: Sequence<T> = this;
    if (initializer === undefined) {
      // No initializer?  Use the first item in the iterable
      const [first, s] = this.split(1);

      if (first.length === 0) {
        throw new TypeError('Empty iterable and no initializer');
      }
      initializer = first[0] as unknown as A;
      iterable = s;
    }

    let count = 0;
    for (const item of iterable) {
      initializer = callback(initializer, item, count++, this);
    }

    return initializer;
  }

  /**
   * Shallow-copy a portion of the sequence into a new sequence, from index
   * start (inclusive) to end (exclusive).
   *
   * @param start - Starting index.  If less than 0, count backward from the
   *   end, which causes buffering.
   * @param end - End index, defaults to the length of the sequence.  If less
   *   than 0 counts backwards from the end of the sequence.
   * @returns A new sequence with the selected items.
   */
  // deno-lint-ignore default-param-last
  slice(start = 0, end?: number): Sequence<T> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        if (end === 0) {
          return;
        }
        const it = that.it[Symbol.iterator]();
        if (start < 0) {
          // Circular buffer up n entries, have to read all the way to the end
          // to ensure we've got them all.
          const n = -start;
          const buffer = new Array(n);
          let cur = 0;
          let len = 0;
          for (const value of that.it) {
            buffer[cur] = value;
            cur = (cur + 1) % n;
            len++;
          }
          if (end === undefined) {
            if (n <= len) {
              yield* buffer.slice(cur);
            }
            yield* buffer.slice(0, cur);
          } else {
            let left = 0;
            if (end > 0) {
              // Yield n - (len - end) items
              if (end > len) {
                end = len;
              }
              left = n - (len - end);
            } else {
              if (end < -len) {
                end = -len;
              }
              left = n + end;
            }
            if (left > 0) {
              const back = buffer.slice(cur, cur + left);
              left -= back.length;
              yield* back;
              if (left > 0) {
                yield* buffer.slice(0, left);
              }
            }
          }
        } else {
          // Discard the first start items
          for (let i = 0; i < start; i++) {
            if (it.next().done) {
              break;
            }
          }

          const stop = (end === undefined) ? Infinity : end;
          if (stop < 0) {
            // Circular buffer -end items, then discard the rest
            const buffer = new Array(-stop);
            let cur = 0;
            let left = -stop;
            let i = it.next();
            while (!i.done) {
              if (left > 0) {
                left--;
              } else {
                yield buffer[cur];
              }
              buffer[cur] = i.value;
              cur = (cur + 1) % -stop;
              i = it.next();
            }
          } else {
            let i = it.next();
            let count = start;
            while (!i.done && (count < stop)) {
              yield i.value;
              i = it.next();
              count++;
            }
          }
        }
      },
    });
  }

  /**
   * Tests whether at least one element generated by the iterator passes the
   * test implemented by the provided function.
   *
   * @param it - The iterator. It may not be fully
   *   consumed.
   * @param f - The predicate.
   * @param thisArg - What is `this` in the function `f`?
   * @returns The predicate matched one of the items in the iterator.
   */
  some(f: filterCallback<T>, thisArg?: unknown): boolean {
    let count = 0;
    for (const i of this.it) {
      if (f.call(thisArg, i, count++, this)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Split a sequence into the first N items, and a sequence of the rest
   * of the elements.  If there aren't N items in the sequence, the array
   * will be short and the Sequence's iterator will be exhausted.
   *
   * @param size - How many items to put in the array.
   * @returns A tuple of an array of size.
   */
  split(size: number): [T[], Sequence<T>] {
    const it = this.it[Symbol.iterator]();
    const ret: T[] = [];
    for (let i = 0; i < size; i++) {
      const n = it.next();
      if (n.done) {
        break;
      }
      ret.push(n.value);
    }

    // FIX: this sequence is not re-usable.
    return [
      ret,
      new Sequence<T>({
        [Symbol.iterator]: () => it,
      }),
    ];
  }

  /**
   * Don't allow anything through until fn returns true for the first time.
   * See the "until" method.
   *
   * @param fn - Return true to turn on the flow.
   * @returns Sequence with the front excluded.
   */
  startWhen(fn: filterCallback<T>): Sequence<T> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        let i = 0;
        let running = false;
        for (const t of that.it) {
          if (running) {
            yield t;
          } else {
            if (fn(t, i++, that)) {
              running = true;
              yield t;
            }
          }
        }
      },
    });
  }

  /**
   * Yields the first <code>n</code> elements of the input iterable. If
   * <code>n</code> is negative, behaves like
   * <code>{@link trunc}(iterable, -n)</code>.
   *
   * @param n - The number of elements to include in the output.
   * @returns A generator that yields the front of the input
   */
  take(n: number): Sequence<T> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        if (n === 0) {
          return;
        }

        if (n < 0) {
          yield* that.trunc(-n);
          return;
        }

        for (const val of that.it) {
          yield val;
          if (--n <= 0) {
            return;
          }
        }
      },
    }, n);
  }

  /**
   * If the Sequence isn't already an array, turn it into one.
   * Could be infinitely-costly for an infinite sequence.
   *
   * @returns Sequence coverted to Array
   */
  toArray(): T[] {
    return Array.isArray(this.it) ? this.it : [...this.it];
  }

  /**
   * Transform the iterator inside the sequence into an Array.
   * No-op if the iterator is already an Array.
   *
   * @returns Possibly new Sequence, where the iterator is an Array.
   */
  toArraySequence(): Sequence<T> {
    return Array.isArray(this.it) ? this : new Sequence([...this.it]);
  }

  /**
   * Yields all elements of the iterable except the last <code>n</code> ones.
   * If <code>n</code> is negative, behaves like
   * <code>{@link take}(iterable, -n)</code>.
   *
   * @param n - Number of elements to exclude at the end
   * @returns A generator that yields the front of the input
   */
  trunc(n: number): Sequence<T> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        if (n < 0) {
          yield* that.take(-n);
          return;
        }

        if (n === 0) {
          yield* that.it;
          return;
        }

        // Circular buffer up n entries, then serve old ones as we go
        const buffer = new Array(n);
        let cur = 0;
        let left = n;
        for (const value of that.it) {
          if (left > 0) {
            left--;
          } else {
            yield buffer[cur];
          }
          buffer[cur] = value;
          cur = (cur + 1) % n;
        }
      },
    });
  }

  /**
   * Return the start of a sequence, until fn returns true;
   *
   * @param fn - Return true to stop the flow.
   * @returns A sequence with the back lopped off.
   */
  until(fn: filterCallback<T>): Sequence<T> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T, void, undefined> {
        let i = 0;
        for (const t of that.it) {
          if (fn(t, i++, that)) {
            break;
          }
          yield t;
        }
      },
    });
  }

  /**
   * A sliding window of N items over the sequence.
   *
   * @param size - The number of items in each sequence.
   * @returns A new sequence that generates each window
   */
  windows(size: number): Sequence<T[]> {
    // deno-lint-ignore no-this-alias
    const that = this;
    return new Sequence({
      *[Symbol.iterator](): Generator<T[], void, undefined> {
        const it = that.it[Symbol.iterator]();
        const last: T[] = [];
        for (let i = 0; i < size; i++) {
          const n = it.next();
          if (n.done) {
            return;
          }
          last.push(n.value);
        }
        do {
          yield [...last];
          const next = it.next();
          if (next.done) {
            return;
          }
          last.shift();
          last.push(next.value);
        } while (true);

        //
        // const [buf, it] = that.split(size);
        // yield [...buf];
        // for (const t of it) {
        //   buf.shift();
        //   buf.push(t);
        //   yield [...buf];
        // }
      },
    });
  }

  //#endregion Methods
}

export class NumberSequence extends Sequence<number> {
  /**
   * The mean of the series.
   *
   * @returns The average of the numbers in the sequence
   */
  avg(): number {
    let max = -Infinity;
    const tot = this.reduce((t, v, i) => {
      max = i;
      return t + v;
    }, 0);
    if (max === -Infinity) {
      return NaN;
    }
    return tot / (max + 1);
  }

  /**
   * Cumulative Moving Average (CMA).  A sequence that yields the mean
   * up to the point of each item in the original sequence.
   *
   * @returns A sequence with the mean so far.
   */
  cumulativeAvg(): NumberSequence {
    // See:
    // https://en.wikipedia.org/wiki/Moving_average#Cumulative_moving_average
    // deno-lint-ignore no-this-alias
    const that = this;
    return new NumberSequence({
      *[Symbol.iterator](): Generator<number, void, undefined> {
        const it = that.it[Symbol.iterator]();
        let item = it.next();
        if (item.done) {
          return;
        }
        let count = 0;
        let cma: number = item.value;
        while (!item.done) {
          count++;
          cma += (item.value - cma) / count;
          yield cma;
          item = it.next();
        }
      },
    });
  }

  /**
   * Specialize histogram() to return a sequence instead of an object.
   * The sequence should be all integers greater or equal to 0.
   *
   * @returns Sequence of counts
   */
  histogramArray(): number[] {
    const res: number[] = [];
    for (const v of this.it) {
      const x = Math.floor(v);
      if ((x !== v) || (x < 0)) {
        throw new Error('Invalid input stream, must be non-negative integers');
      }
      res[x] = (res[x] ?? 0) + 1;
    }
    return res;
  }

  /**
   * Sum up all of the items in the sequence.
   *
   * @returns Sum
   */
  sum(): number {
    return this.reduce((t, v) => t + v);
  }

  /**
   * Multiply all of the items of the sequence together.
   *
   * @returns Product of items.
   */
  product(): number {
    return this.reduce((t, v) => t * v);
  }

  /**
   * Generate a sequence with an item for each item in the input series, whose
   * values are the standard deviation up to that point in the input series.
   *
   * @returns Sequence of stddevp deviations.
   */
  cumulativeStdev(): NumberSequence {
    // See:
    // https://en.wikipedia.org/wiki/Standard_deviation#Rapid_calculation_methods
    // deno-lint-ignore no-this-alias
    const that = this;
    return new NumberSequence({
      *[Symbol.iterator](): Generator<number, void, undefined> {
        const it = that.it[Symbol.iterator]();
        let item = it.next();
        if (item.done) {
          return;
        }
        let count = 0;
        let cma: number = item.value;
        let Q = 0;
        while (!item.done) {
          count++;
          const newCMA = cma + (item.value - cma) / count;
          Q += (item.value - cma) * (item.value - newCMA);
          cma = newCMA;
          yield Math.sqrt(Q / count);
          item = it.next();
        }
      },
    });
  }

  /**
   * Standard deviation of a whole series.
   *
   * @returns - stddevp
   */
  stdev(): number {
    let count = 0;
    let cma = 0;
    let Q = 0;
    for (const n of this.it) {
      count++;
      const newCMA = cma + (n - cma) / count;
      Q += (n - cma) * (n - newCMA);
      cma = newCMA;
    }
    return Math.sqrt(Q / count);
  }

  /**
   * Take the first n, optimizied for NumberSequence.
   *
   * @param n - The number of sequence items to take
   * @returns Sequence of up to n items
   */
  override take(n: number): NumberSequence {
    return new NumberSequence(super.take(n).it, n);
  }
}
