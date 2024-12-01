import { mod } from './utils.ts';

export interface PointLike {
  x: number;
  y: number;
}

export enum Dir {
  E,
  S,
  W,
  N,
}

export const AllDirs: Dir[] = [
  Dir.E,
  Dir.S,
  Dir.W,
  Dir.N,
];

export const OppositeDir: Record<Dir, Dir> = {
  [Dir.E]: Dir.W,
  [Dir.S]: Dir.N,
  [Dir.W]: Dir.E,
  [Dir.N]: Dir.S,
};

export class Point implements PointLike {
  static CARDINAL: [dx: number, dy: number][] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  x: number;
  y: number;

  constructor(p: PointLike);
  constructor(x: number, y: number);
  constructor(xp: PointLike | number, yp?: number) {
    const [x, y] = (typeof xp === 'number') ? [xp, yp!] : [xp.x, xp.y];
    this.x = x;
    this.y = y;
  }

  static sort(a: Point, b: Point): number {
    return (a.x - b.x) || (a.y - b.y);
  }

  xlate(d: PointLike): Point;
  xlate(dx: number, dy: number): Point;
  xlate(xp: PointLike | number, yp?: number): Point {
    const [dx, dy] = (typeof xp === 'number') ? [xp, yp!] : [xp.x, xp.y];
    return new Point(this.x + dx, this.y + dy);
  }

  inDir(dir: Dir): Point {
    const [dx, dy] = Point.CARDINAL[dir as number];
    return this.xlate(dx, dy);
  }

  stretch(len: number): Point {
    return new Point(this.x * len, this.y * len);
  }

  dist(p: PointLike): number {
    return Math.sqrt(Math.abs(this.x - p.x) ** 2 + Math.abs(this.y - p.y) ** 2);
  }

  manhattan(p: PointLike): number {
    return Math.abs(this.x - p.x) + Math.abs(this.y - p.y);
  }

  equals(p: PointLike): boolean {
    return (this.x === p.x) && (this.y === p.y);
  }

  cardinal(r?: Rect): Point[] {
    const ret: Point[] = [];
    for (const [dx, dy] of Point.CARDINAL) {
      const p = this.xlate(dx, dy);
      if (r && !r.check(p)) {
        continue;
      }
      ret.push(p);
    }
    return ret;
  }

  toString(): string {
    return `${this.x},${this.y}`;
  }

  [Symbol.for('Deno.customInspect')](): string {
    return this.toString();
  }
}

export type RectMapCallback<T, U> = (
  value: T,
  x: number,
  y: number,
  r: Rect<T>,
) => U;

export type RectTransformCallback<T, U> = (
  prev: U,
  value: T,
  x: number,
  y: number,
  r: Rect<T>,
) => U;

export type RectInitCallback<T> = (
  x: number,
  y: number,
) => T;

export type RectEachCallback<T> = (
  value: T,
  x: number,
  y: number,
  r: Rect<T>,
) => void;

export class Rect<T = string> {
  #vals: T[][];

  constructor(wrapped: T[][]) {
    this.#vals = wrapped;
  }

  /**
   * Create a newly-initialized rect with the given size.
   *
   * @param width
   * @param height
   * @param val constant, or function that returns a per-cell value
   * @returns Rect of size width, height, initialized by val
   */
  static ofSize<U>(
    width: number,
    height: number,
    val: U | RectInitCallback<U>,
  ): Rect<U> {
    const f = (typeof val) === 'function';
    const v = Array.from<unknown, U[]>(Array(height), (_, j) => {
      return Array.from<unknown, U>(Array(width), (_, i) => {
        if (f) {
          return (val as RectInitCallback<U>).call(this, i, j);
        }
        return val;
      });
    });
    return new Rect(v);
  }

  /**
   * Are x and y inside the rect?
   * @param x
   * @param y
   * @throws if either invalid
   */
  #check(p: PointLike): void;
  #check(x: number, y: number): void;
  #check(xp: PointLike | number, yp?: number): void {
    const [x, y] = (typeof xp === 'number') ? [xp, yp!] : [xp.x, xp.y];
    if (!this.check(x, y)) {
      throw new RangeError(`${x},${y} not inside rect`);
    }
  }

  check(p: PointLike): boolean;
  check(x: number, y: number): boolean;
  check(xp: PointLike | number, yp?: number): boolean {
    const [x, y] = (typeof xp === 'number') ? [xp, yp!] : [xp.x, xp.y];
    return (y >= 0) && (y < this.#vals.length) &&
      (x >= 0) && (x < this.#vals[y].length);
  }

  /**
   * Assume that the rectangle is uniform, so the length of the first row
   * is the width.
   *
   * @readonly
   * @type {number}
   */
  get width(): number {
    return this.#vals[0].length;
  }

  /**
   * Number of rows.
   *
   * @readonly
   * @type {number}
   */
  get height(): number {
    return this.#vals.length;
  }

  /**
   * Get a value at a given [x,y] position.  Getting from an offset is somewhat
   * common, so it is included.
   *
   * @param x
   * @param y
   * @param dx Difference from x
   * @param dy Difference from y
   * @returns
   */
  get(p: PointLike): T;
  get(x: number, y: number, dx?: number, dy?: number): T;
  get(xp: PointLike | number, yp?: number, dx = 0, dy = 0): T {
    const [x, y] = (typeof xp === 'number') ? [xp, yp!] : [xp.x, xp.y];
    const col = x + dx;
    const line = y + dy;
    this.#check(col, line);
    return this.#vals[line][col];
  }

  /**
   * Set the value at [x,y].
   *
   * @param x
   * @param y
   * @param val
   */
  set(p: PointLike, val: T): void;
  set(x: number, y: number, val: T): void;
  set(xp: PointLike | number, yv: number | T, val?: T): void {
    if ((typeof xp === 'number') && (typeof yv === 'number')) {
      this.#check(xp, yv);
      this.#vals[yv][xp] = val!;
    } else {
      this.#check(xp as PointLike);
      this.#vals[(xp as PointLike).y][(xp as PointLike).x] = yv as T;
    }
  }

  /**
   * Iterate over the rect.
   *
   * @param callbackfn
   */
  forEach(callbackfn: RectEachCallback<T>): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.#vals[y].length; x++) {
        callbackfn.call(this, this.get(x, y), x, y, this);
      }
    }
  }

  *[Symbol.iterator](): Generator<
    [val: T, x: number, y: number],
    undefined,
    undefined
  > {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.#vals[y].length; x++) {
        yield [this.get(x, y), x, y];
      }
    }
  }

  *entries(): Generator<[Point, T], undefined, undefined> {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.#vals[y].length; x++) {
        yield [new Point(x, y), this.get(x, y)];
      }
    }
  }

  /**
   * Map from the rect to a new rect, with a new type.
   *
   * @param callbackfn
   * @returns
   */
  map<U>(
    callbackfn: RectMapCallback<T, U>,
  ): Rect<U> {
    const vals: U[][] = [];
    const h = this.height;
    const w = this.width;
    for (let y = 0; y < h; y++) {
      const row: U[] = [];
      for (let x = 0; x < w; x++) {
        row.push(callbackfn.call(this, this.get(x, y), x, y, this));
      }
      vals.push(row);
    }
    return new Rect(vals);
  }

  /**
   * Run a reducer over the contents of the rect.  If initial value not
   * specified, calls callbackFn for the first time with
   * (r[0,0], r[1,0], 1, 0, r).
   *
   * @param callbackFn
   * @param initial
   * @returns
   */
  reduce<U = T>(
    callbackFn: RectTransformCallback<T, U>,
    initial?: U,
  ): U {
    let first = initial === undefined;
    let prev = (first ? this.#vals[0][0] : initial) as U;
    this.forEach((val, x, y) => {
      if (first) {
        first = false;
      } else {
        prev = callbackFn.call(this, prev, val, x, y, this);
      }
    });
    return prev;
  }

  /**
   * @returns The values in the rect.
   */
  rows(): T[][] {
    return this.#vals;
  }

  /**
   * @returns An array of column arrays.
   */
  columns(): T[][] {
    return this.#vals[0].map((_, i) => this.#vals.map((v) => v[i]));
  }

  /**
   * @returns New rect with swapped axes.
   */
  transpose(): Rect<T> {
    return new Rect(this.columns());
  }

  /**
   * @returns Deep copy
   */
  copy(): Rect<T> {
    return new Rect(structuredClone(this.#vals));
  }

  /**
   * @param x
   * @param y
   * @param val new value
   * @returns Copy of rect, with [x,y] set to val
   */
  with(p: PointLike, val: T): Rect<T>;
  with(x: number, y: number, val: T): Rect<T>;
  with(xp: PointLike | number, yp: number | T, val?: T): Rect<T> {
    const [x, y, v] = (typeof xp === 'number')
      ? [xp, yp as number, val as T]
      : [xp.x, xp.y, val!];
    const r = this.copy();
    r.set(x, y, v);
    return r;
  }

  /**
   * @returns Copy of rect, rotated right
   */
  rotateClockwise(): Rect<T> {
    // Transpose and reverse columns
    return new Rect(
      this.#vals[0].map((_, col) =>
        this.#vals.map((row) => row[col]).reverse()
      ),
    );
  }

  /**
   * @returns Copy of rect, rotated left
   */
  rotateCounterClockwise(): Rect<T> {
    return new Rect(
      this.#vals[0].map((_, col) =>
        this.#vals.map((row) => row[row.length - col - 1])
      ),
    );
  }

  indexOf(needle: T): Point | undefined {
    for (const [val, x, y] of this) {
      if (val === needle) {
        return new Point(x, y);
      }
    }
    return undefined;
  }

  /**
   * Wrap rectangle with a new value, so all outside edges are the same.
   *
   * @param val
   * @returns Wrapped rect, height + 2, width + 2
   */
  wrap(val: T): Rect<T> {
    const vals = structuredClone(this.#vals);
    vals.unshift(Array(this.width).fill(val));
    vals.push(Array(this.width).fill(val));
    return new Rect(vals.map((x: T[]) => [val, ...x, val]));
  }

  /**
   * @param other
   * @returns True if all vals equal
   */
  equals(other: Rect<T>): boolean {
    if (this === other) {
      return true;
    }
    if (
      !other ||
      other.height !== this.height ||
      other.width !== this.width
    ) {
      return false;
    }

    return this.reduce((t, val, x, y) => t && (val === other.get(x, y)), true);
  }

  /**
   * @param separator For non-trival rects, use ' ' or ',' (.e.g)
   * @returns multi-line string, no trailing newline
   */
  toString(separator = ''): string {
    return this.#vals
      .map((line) => line.map((v) => String(v)).join(separator))
      .join('\n');
  }

  [Symbol.for('Deno.customInspect')](): string {
    return this.toString();
  }
}

export class InfiniteRect<T> extends Rect<T> {
  max: Point;
  min: Point;

  constructor(wrapped: T[][]) {
    super(wrapped);
    this.min = new Point(0, 0);
    this.max = new Point(this.width, this.height);
  }

  check(_xp: PointLike | number, _yp?: number): boolean {
    return true;
  }

  get(xp: PointLike | number, yp?: number, dx = 0, dy = 0): T {
    const [x, y] = (typeof xp === 'number') ? [xp, yp!] : [xp.x, xp.y];
    const col = mod(x + dx, this.width);
    const line = mod(y + dy, this.height);
    return super.get(col, line);
  }

  set(xp: PointLike | number, yv: number | T, val?: T): void {
    const [x, y] = ((typeof xp === 'number') && (typeof yv === 'number'))
      ? [xp, yv]
      : [(xp as PointLike).x, (xp as PointLike).y];
    const col = mod(x, this.width);
    const line = mod(y, this.height);

    this.min.x = Math.min(this.min.x, col);
    this.min.y = Math.min(this.min.y, line);
    this.max.x = Math.max(this.max.x, col);
    this.max.y = Math.max(this.max.y, line);

    super.set(col, line, val!);
  }

  slice(min: Point, max: Point): Rect<T> {
    return InfiniteRect.ofSize<T>(
      max.x - min.x + 1,
      max.y - min.y + 1,
      (x: number, y: number): T => this.get(x, y),
    );
  }
}
