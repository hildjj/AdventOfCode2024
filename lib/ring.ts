/**
 * Ring Buffer.
 */
export class Ring<T> {
  #length: number;
  #buf: T[];
  #count = 0;

  constructor(length: number) {
    this.#length = length;
    this.#buf = Array.from({ length });
  }

  push(val: T): void {
    this.#buf[this.#count++ % this.#length] = val;
  }

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

  get count(): number {
    return this.#count;
  }

  get size(): number {
    return (this.#count > this.#length) ? this.#length : this.#count;
  }

  get full(): boolean {
    return this.#count >= this.#length;
  }
}
