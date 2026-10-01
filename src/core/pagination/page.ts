export class Page<T> {
  readonly items: readonly T[];
  readonly total: number;

  constructor(items: readonly T[], total: number) {
    this.items = [...items];
    this.total = total;
  }

  map<R>(mapper: (item: T) => R): Page<R> {
    return new Page(this.items.map(mapper), this.total);
  }

  totalPages(size: number): number {
    return size === 0 ? 0 : Math.ceil(this.total / size);
  }
}
