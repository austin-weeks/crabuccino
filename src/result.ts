// Temporary stub implementations

import { Panic } from "./panic";

export type Result<T, E> = Ok<T, E> | Err<T, E>;
export class Ok<T, E> {
  constructor(readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  unwrap(): T {
    return this.value;
  }
  unwrapErr(): never {
    throw new Panic("caled unwrapErr on Ok");
  }
}
export class Err<T, E> {
  constructor(readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }

  unwrap(): never {
    throw new Panic("called unwrap on Err");
  }

  unwrapErr(): E {
    return this.error;
  }
}
