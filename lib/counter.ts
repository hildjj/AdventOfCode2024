type countFilter = (n: number, s: string) => number | boolean;
type numberCountFilter = (n: number, s: number) => number | boolean;
const totalCount: countFilter = (n: number): number => n;
const numberTotalCount: numberCountFilter = (n: number): number => n;

/**
 * Count all the things!
 * If the things have multiple parts, those parts will be stringified and
 * joined by commas.
 */
export class Counter<T = string> {
  points: { [id: string]: number } = Object.create(null);

  /**
   * Iterate over the entries in points.
   */
  *[Symbol.iterator](): Generator<[string, number], void, undefined> {
    yield* Object.entries(this.points);
  }

  /**
   * Get the current value of the given key.
   *
   * @param vals - The list of values that describe the thing.
   * @returns - The current total for this thing.
   */
  get(...vals: T[]): number {
    const joined = String(vals);
    return this.points[joined] ?? 0;
  }

  /**
   * Get the current keys in the counter.  Returns the concatenated string
   * values, which isn't useful unless the keys are plain strings.
   *
   * @returns - All of the current keys
   */
  keys(): string[] {
    return Object.keys(this.points);
  }

  /**
   * Current values.
   *
   * @returns - All of the current values
   */
  values(): number[] {
    return Object.values(this.points);
  }

  /**
   * Add a thing.
   *
   * @param vals - The list of values that describe the thing.
   * @returns - The current total for this thing.
   */
  add(...vals: T[]): number {
    const joined = String(vals);
    const val = (this.points[joined] ?? 0) + 1;
    this.points[joined] = val;
    return val;
  }

  /**
   * Assuming that each value is a simple non-array, add each.
   *
   * @param vals
   * @returns
   */
  addAll(vals: Iterable<T>): this {
    for (const v of vals) {
      this.add(v);
    }
    return this;
  }

  /**
   * Add something other than one.
   *
   * @param count - The amount to add.
   * @param vals - The list of values that describe the thing.
   * @returns number - The current total for this thing.
   */
  sum(count: number, ...vals: T[]): number {
    const joined = String(vals);
    const val = (this.points[joined] ?? 0) + count;
    this.points[joined] = val;
    return val;
  }

  /**
   * Count the total number of things, possibly filtered.
   *
   * @param fn - A filter function.  If it returns boolean, count 1 if true.
   *   If number, counts that many.
   * @returns The count of all of the things that match the filter.
   */
  total(fn: countFilter = totalCount): number {
    return Object
      .entries(this.points)
      .reduce((t, [s, v]): number => {
        const res = fn(v, s);
        if (typeof res === 'boolean') {
          return t + (res ? 1 : 0);
        }
        return t + res;
      }, 0);
  }

  /**
   * The maximum entry.
   *
   * @returns the [key, value] of the maximum value, or null if empty.
   */
  max(): [string, number] | undefined {
    let mv = -Infinity;
    let mk: string | null = null;
    for (const [k, v] of this) {
      if (v > mv) {
        mv = v;
        mk = k;
      }
    }
    return (mk === null) ? undefined : [mk, mv];
  }

  /**
   * How many unique things have been added?
   *
   * @returns The count.
   */
  get size(): number {
    return Object.keys(this.points).length;
  }
}

/**
 * Count all the things!
 * (When the things are single numbers)
 */
export class NumberCounter {
  points = new Map<number, number>();

  /**
   * Iterate over the entries in points.
   */
  *[Symbol.iterator](): Generator<[number, number], void, undefined> {
    yield* this.points.entries();
  }

  /**
   * Get the current value of the given key.
   *
   * @param vals - The thing.
   * @returns - The current total for this thing, or zero if thing doesn't exist.
   */
  get(val: number): number {
    return this.points.get(val) ?? 0;
  }

  /**
   * Get the current keys in the counter.  Returns the concatenated string
   * values, which isn't useful unless the keys are plain strings.
   *
   * @returns - All of the current keys
   */
  keys(): MapIterator<number> {
    return this.points.keys();
  }

  /**
   * Current values.
   *
   * @returns - All of the current values
   */
  values(): MapIterator<number> {
    return this.points.values();
  }

  /**
   * Add a thing.
   *
   * @param vals - The list of values that describe the thing.
   * @returns - The current total for this thing.
   */
  add(key: number): number {
    const val = (this.points.get(key) ?? 0) + 1;
    this.points.set(key, val);
    return val;
  }

  /**
   * Assuming that each value is a simple non-array, add each.
   *
   * @param vals
   * @returns
   */
  addAll(vals: Iterable<number>): this {
    for (const v of vals) {
      this.add(v);
    }
    return this;
  }

  /**
   * Add something other than one.
   *
   * @param count - The amount to add.
   * @param vals - The list of values that describe the thing.
   * @returns number - The current total for this thing.
   */
  sum(count: number, key: number): number {
    const val = (this.points.get(key) ?? 0) + count;
    this.points.set(key, val);
    return val;
  }

  /**
   * Count the total number of things, possibly filtered.
   *
   * @param fn - A filter function.  If it returns boolean, count 1 if true.
   *   If number, counts that many.
   * @returns The count of all of the things that match the filter.
   */
  total(fn: numberCountFilter = numberTotalCount): number {
    return this
      .points
      .entries()
      .reduce((t, [s, v]) => {
        const res = fn(v, s);
        if (typeof res === 'boolean') {
          return t + (res ? 1 : 0);
        }
        return t + res;
      }, 0);
  }

  /**
   * The maximum entry.
   *
   * @returns the [key, value] of the maximum value, or null if empty.
   */
  max(): [number, number] | undefined {
    let mv = -Infinity;
    let mk = NaN;
    for (const [k, v] of this.points) {
      if (v > mv) {
        mv = v;
        mk = k;
      }
    }
    return isNaN(mk) ? undefined : [mk, mv];
  }

  /**
   * How many unique things have been added?
   *
   * @returns The count.
   */
  get size(): number {
    return this.points.size;
  }
}
