/**
 * Ring Buffer.
 * TODO (@hildjj): allow destructive reads.
 */
export class Ring<T> {
  #length: number;
  #buf: T[];
  #count = 0;

  /**
   * Creates an initially-empty buffer.
   *
   * @param length Maximum number of things to store.
   */
  constructor(length: number) {
    this.#length = length;
    this.#buf = Array.from({ length });
  }

  /**
   * Add a value to the end, bumping off the oldest entry if the buffer
   * is full.
   *
   * @param val
   */
  push(val: T): void {
    this.#buf[this.#count++ % this.#length] = val;
  }

  /**
   * Get the current buffer contents.
   *
   * @returns A copy of the current contents, in logical order.
   */
  get(): T[] {
    if (this.#count < this.#length) {
      return this.#buf.slice(0, this.#count);
    }
    const pos = this.#count % this.#length;
    if (pos === 0) {
      return this.#buf.slice(0);
    }
    return [...this.#buf.slice(pos), ...this.#buf.slice(0, pos)];
  }

  /**
   * How many times has this buffer been added to?
   *
   * @readonly
   * @type {number}
   */
  get count(): number {
    return this.#count;
  }

  /**
   * Current size.  Maxes out at length;
   *
   * @readonly
   * @type {number}
   */
  get size(): number {
    return (this.#count > this.#length) ? this.#length : this.#count;
  }

  /**
   * Is the buffer full already?
   *
   * @readonly
   * @type {boolean}
   */
  get full(): boolean {
    return this.#count >= this.#length;
  }

  /**
   * Get the original length of the buffer.
   * TODO (@hildjj): Allow setting the length to a new value, potentially
   * losing data from the beginning of the buffer.
   *
   * @readonly
   * @type {number}
   */
  get length(): number {
    return this.#length;
  }
}
