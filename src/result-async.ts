import { inspectSymbol, type Option } from "./option";
import { Panic } from "./panic";
import { Err, Ok, type Result } from "./result";
import { stringify } from "./stringify";

/**
 * An asynchronous version of `Result<T, E>`.
 *
 * It is `then`able, meaning it can be `await`ed like a `Promise<Result<T, E>>`.
 *
 * `ResultAsync` exposes most of the methods of `Result` and can be used to chain asynchronous operations.
 */
export class ResultAsync<T, E> implements PromiseLike<Result<T, E>> {
  /** Creates a `ResultAsync<T, E>` from a `Promise` resolving to `Result<T, E>`. */
  constructor(readonly promise: Promise<Result<T, E>>) {}
  toString(): string {
    return "ResultAsync";
  }
  // Override Node/Vitest '.inspect()'
  [inspectSymbol]() {
    return this.toString();
  }

  then<TResult1 = Result<T, E>, TResult2 = never>(
    onfulfilled?:
      ((value: Result<T, E>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?:
      ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  // TODO: implement these
  // ---------- Factory Methods ----------

  // ---------- Instance Methods ----------

  /**
   * Returns the `ResultAsync<T, E>` as a `Promise<Result<T, E>>`.
   */
  asPromise(): Promise<Result<T, E>> {
    return this.promise;
  }

  /**
   * Converts from `ResultAsync<T, E>` to `Promise<Option<T>>`.
   *
   * Converts self into `Some<T>` if `Ok`, and discarding the error to `None`, if `Err`.
   */
  ok(): Promise<Option<T>> {
    return this.promise.then(res => res.ok());
  }

  /**
   * Converts from `ResultAsync<T, E>` to `Promise<Option<E>>`.
   *
   * Converts self into `Some<E>` if `Err`, and discarding the success value to `None`, if `Ok`.
   */
  err(): Promise<Option<E>> {
    return this.promise.then(res => res.err());
  }

  /**
   * Maps a `ResultAsync<T, E>` to a `ResultAsync<U, E>` by applying a function `f` to a contained `Ok` value, leaving an `Err` value untouched.
   *
   * The applied function `f` may be synchronous or asynchronous.
   *
   * This function can be used to compose the results of two functions.
   */
  map<U>(f: (ok: T) => U | Promise<U>): ResultAsync<U, E> {
    return new ResultAsync(
      this.promise.then(async res => {
        if (res.isErr()) {
          // @ts-expect-error - okay type is irrelevant for Err
          return res as Err<U, E>;
        }

        return new Ok(await f(res.inner()));
      }),
    );
  }

  /**
   * Returns a promise resolving to the provided default `def` (if `Err`), or applies a function `f` to the contained value (if `Ok`).
   *
   * The applied function `f` may be synchronous or asynchronous;
   *
   * Arguments passed to `mapOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `mapOrElse`, which is lazily evaluated.
   */
  mapOr<U>(def: U, f: (ok: T) => U | Promise<U>): Promise<U> {
    return this.promise.then(async res => {
      if (res.isOk()) {
        return await f(res.inner());
      }
      return def;
    });
  }

  /**
   * Maps a `ResultAsync<T, E>` to `Promise<U>` by applying fallback function `def` to a contained `Err` value, or function `f` to a contained `Ok` value.
   *
   * The functions `f` and `def` may be synchronous or asynchronous
   *
   * This function can be used to unpack a successful result while handling an error.
   */
  mapOrElse<U>(
    def: (err: E) => U | Promise<U>,
    f: (ok: T) => U | Promise<U>,
  ): Promise<U> {
    return this.promise.then(async res => {
      if (res.isOk()) {
        return await f(res.inner());
      }
      return await def(res.inner());
    });
  }

  /**
   * Maps a `ResultAsync<T, E>` to `ResultAsync<T, F>` by applying a function `f` to a contained `Err` value, leaving an `Ok` value untouched.
   *
   * The applied function `f` may be synchronous or asynchronous.
   *
   * This function can be used to pass through a successful result while handling an error.
   */
  mapErr<F>(f: (err: E) => F | Promise<F>): ResultAsync<T, F> {
    return new ResultAsync(
      this.promise.then(async res => {
        if (res.isOk()) {
          // @ts-expect-error - error type is irrelevant to Ok
          return res as Ok<T, F>;
        }
        return new Err(await f(res.inner()));
      }),
    );
  }

  /**
   * Calls a function `f` with the contained success value if `Ok`.
   *
   * The function `f` may be synchronous or asynchronous.
   *
   * Returns the original result.
   */
  inspect(f: (ok: T) => void | Promise<void>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then(async res => {
        if (res.isOk()) {
          await f(res.inner());
        }
        return res;
      }),
    );
  }

  /**
   * Calls a function `f` with the contained error value if `Err`.
   *
   * The function `f` may be synchronous or asynchronous.
   *
   * Returns the original result.
   */
  inspectErr(f: (err: E) => void | Promise<void>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then(async res => {
        if (res.isErr()) {
          await f(res.inner());
        }
        return res;
      }),
    );
  }

  /**
   * Returns a promise resolving to the contained success value if `Ok`.
   *
   * Throws an `ExpectationFailed` exception if the result is `Err` with a custom message `msg`.
   */
  expect(msg: string): Promise<T> {
    return this.promise.then(res => res.expect(msg));
  }

  /**
   * Returns a promise resolving to the contained success value if `Ok`.
   *
   * Throws a `Panic` exception if the result is `Err`.
   *
   * Because this function may panic, its use is generally discouraged. Panics are meant for unrecoverable errors.
   * Instead, prefer to handle the `Err` case explicitly, or call `unwrapOr` or `unwrapOrElse`.
   * If you expect the `ResultAsync` to be successful, prefer calling `expect` and specify the reason for your expectation.
   */
  unwrap(): Promise<T> {
    return this.promise.then(res => {
      if (res.isOk()) {
        return res.inner();
      }
      throw new Panic(
        `Called 'ResultAsync.unwrap()' on an 'Err' value: ${stringify(res.inner())}`,
      );
    });
  }

  /**
   * Returns a promise resolving to the the contained error value if `Err`.
   *
   * Throws an `ExpectationFailed` exception if the result is `Ok` with a custom message `msg`.
   */
  expectErr(msg: string): Promise<E> {
    return this.promise.then(res => res.expectErr(msg));
  }

  /**
   * Returns a promise resolving to the contained error value if `Err`.
   *
   * Throws a `Panic` exception if the result is `Ok`.
   *
   * Because this function may panic, its use is generally discouraged. Panics are meant for unrecoverable errors.
   * Instead, prefer to handle the `Ok` case explicitly.
   * If you expect the `ResultAsync` to fail, prefer calling `expectErr` and specify the reason for your expectation.
   */
  unwrapErr(): Promise<E> {
    return this.promise.then(res => {
      if (res.isErr()) {
        return res.inner();
      }
      throw new Panic(
        `Called 'ResultAsync.unwrapErr()' on an 'Ok' value: ${stringify(res.inner())}`,
      );
    });
  }

  /**
   * Returns a promise resolving to the contained success value, but never panics.
   *
   * This method can only be called on results with an `E` type of `never`.
   *
   * Unlike `unwrap`, this method is known to never panic, therefore it can be used instead of `unwrap` as a maintainability safeguard that will fail to compile if the error type of the result is later changed to an error that can actually occur.
   */
  intoOk(this: ResultAsync<T, never>): Promise<T> {
    return this.promise.then(res => {
      if (res.isOk()) {
        return res.inner();
      }
      throw new Panic(
        "Called 'ResultAsync.intoOk()' on an 'Err'. This should never occur and indicates a violation of the method receiver's type constraints.",
      );
    });
  }

  /**
   * Returns a promise resolving to the contained failure value, but never panics.
   *
   * This method can only be called on results with a `T` type of `never`.
   *
   * Unlike `unwrapErr`, this method is known to never panic, therefore it can be used instead of `unwrapErr` as a maintainability safeguard that will fail to compile if the ok type of the result is later changed to a type that can actually occur.
   */
  intoErr(this: ResultAsync<never, E>): Promise<E> {
    return this.promise.then(res => {
      if (res.isErr()) {
        return res.inner();
      }
      throw new Panic(
        "Called 'ResultAsync.intoErr()' on an 'Ok'. This should never occur and indicates a violation of the method receiver's type constraints.",
      );
    });
  }

  /**
   * Returns the result of calling function `f` if the result is `Ok`, otherwise returns the `Err` value self.
   *
   * The applied function `f` may be synchronous or asynchronous.
   *
   * This function can be used for control flow based on result values.
   */
  andThen<U, F = E>(
    f: (ok: T) => Result<U, F> | ResultAsync<U, F>,
  ): ResultAsync<U, E | F> {
    return new ResultAsync(
      this.promise.then(async res => {
        if (res.isErr()) {
          // @ts-expect-error - okay type is irrelevant to Err
          return res as Err<U, E>;
        }
        return await f(res.inner());
      }),
    );
  }

  /**
   * Returns the result of calling function `f` if the result is `Err`, otherwise returns the `Ok` value self.
   *
   * The applied function `f` may be synchronous or asynchronous.
   *
   * This function can be used for control flow based on result values.
   */
  orElse<F, U = T>(
    f: (err: E) => Result<U, F> | ResultAsync<U, F>,
  ): ResultAsync<T | U, F> {
    return new ResultAsync(
      this.promise.then(async res => {
        if (res.isOk()) {
          // @ts-expect-error - error type is irrelevant to Ok
          return res as Ok<T, F>;
        }
        return await f(res.inner());
      }),
    );
  }

  /**
   * Returns a promise resolving to the contained `Ok` value or a provided default `def` if `Err`.
   *
   * Arguments passed to `unwrapOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `unwrapOrElse`, which is lazily evaluated.
   */
  unwrapOr(def: T): Promise<T> {
    return this.promise.then(res => res.unwrapOr(def));
  }

  /**
   * Returns a promise resolving to the contained `Ok` value or computes it from function `f` if `Err`.
   *
   * The function `f` may be synchronous or asynchronous.
   */
  async unwrapOrElse(f: (err: E) => T | Promise<T>): Promise<T> {
    const res = await this;
    if (res.isOk()) {
      return res.inner();
    }
    return await f(res.inner());
  }

  /**
   * Match on each variant of `ResultAsync`.
   *
   * The `ok` and `err` branches may be synchronous or asynchronous.
   *
   * Unlike _Rust_, your match branches may return different types, though it is generally recommended to return the same type.
   *
   * @example
   * ```
   * import { type ResultAsync } from "crabuccino";
   *
   * const username: ResultAsync<User, Error> = getUser();
   *
   * const sirName = await username.match(
   *   async (user) => `Sir ${user.name} the ${await getTitle(user)}`,
   *   (e) => {
   *     console.error("Failed to get user:", e);
   *     return "Sir NoName the mysterious";
   *   }
   * );
   * ```
   */
  async match<A, B = A>(
    ok: (t: T) => A | Promise<A>,
    err: (e: E) => B | Promise<B>,
  ): Promise<A | B> {
    const res = await this;
    if (res.isOk()) {
      return await ok(res.inner());
    }
    return await err(res.inner());
  }

  /**
   * Transposes a `ResultAsync` of an `Option` into a promise resolving to an `Option` of a `Result`.
   *
   * `Ok(None)` will be mapped to `None`. `Ok(Some(_))` and `Err(_)` will be mapped to `Some(Ok(_))` and `Some(Err(_))`.
   */
  transpose<T>(this: ResultAsync<Option<T>, E>): Promise<Option<Result<T, E>>> {
    return this.promise.then(res => res.transpose());
  }

  /**
   * Removes one level of nesting - converts `ResultAsync<ResultAsync<T, E>, E>` to `ResultAsync<T, E>`.
   */
  flatten<T>(this: ResultAsync<ResultAsync<T, E>, E>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then(async res => {
        if (res.isOk()) {
          return await res.inner();
        } else {
          return res as Err<T, E>;
        }
      }),
    );
  }
}
