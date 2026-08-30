import { type Result } from "./result";

export class ResultAsync<T, E> implements PromiseLike<Result<T, E>> {
  constructor(readonly promise: Promise<Result<T, E>>) {}

  then<TResult1 = Result<T, E>, TResult2 = never>(
    onfulfilled?:
      ((value: Result<T, E>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?:
      ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
