export interface PageQuery {
  readonly page: number;
  readonly size: number;
}

export function offsetOf(query: PageQuery): number {
  return query.page * query.size;
}
