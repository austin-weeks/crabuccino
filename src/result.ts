import { inspectSymbol, None, Some, type Option } from "./option";
import { ExpectationFailed, Panic } from "./panic";
import { ResultAsync } from "./result-async";
import { stringify } from "./stringify";

interface IResult<T, E> {
  /**
   * Converts the `Result` into a `ResultAsync` that can be `await`ed and used to chain `async` operations.
   */
  toAsync(): ResultAsync<T, E>;

  /**
   * Returns `true` if the result is an `Ok`.
   *
   * When this method returns `true`, _TypeScript_ narrows the type from `Result<T, E>` to `Ok<T>`, allowing access to the `Ok<T>.inner()` method to retrieve the contained success value.
   *
   * When this method returns `false`, _TypeScript_ narrows the type from `Result<T, E>` to `Err<E>`.
   *
   * @example
   * ```
   * import { Ok, type Result } from "crabuccino";
   *
   * const res: Result<string, Error> = new Ok("hello");
   *
   * if (res.isOk()) {
   *   console.assert(res.inner() === "hello");
   * }
   * ```
   */
  isOk(): this is Ok<T, E>;

  /**
   * Returns `true` if the result is `Ok` and the value inside of it matches a `predicate`.
   */
  isOkAnd(predicate: (ok: T) => boolean): boolean;

  /**
   * Returns `true` if the result is an `Err`.
   *
   * When this method returns `true`, _TypeScript_ narrows the type from `Result<T, E>` to `Err<E>`, allowing access to the `Err<E>.inner()` method to retrieve the contained error value.
   *
   * When this method returns `false`, _TypeScript_ narrows the type from `Result<T, E>` to `Ok<T>`.
   *
   * @example
   * ```
   * import { Err, type Result } from "crabuccino";
   *
   * const res: Result<string, Error> = new Err(new Error("oops!"));
   *
   * if (res.isErr()) {
   *   console.assert(res.inner().message === "oops!");
   * }
   * ```
   */
  isErr(): this is Err<T, E>;

  /**
   * Returns `true` if the result is `Err` and the value inside of it matches a `predicate`.
   */
  isErrAnd(predicate: (err: E) => boolean): boolean;

  /**
   * Converts from `Result<T, E>` to `Option<T>`.
   *
   * Converts self into `Some<T>` if `Ok`, discarding the error to `None`, if `Err`.
   */
  ok(): Option<T>;

  /**
   * Converts from `Result<T, E>` to `Option<E>`.
   *
   * Converts self into `Some<E>` if `Err`, discarding the success value to `None`, if `Ok`.
   */
  err(): Option<E>;

  /**
   * Maps a `Result<T, E>` to a `Result<U, E>` by applying a function `f` to a contained `Ok` value, leaving an `Err` value untouched.
   *
   * This function can be used to compose the results of two functions.
   */
  map<U>(f: (ok: T) => U): Result<U, E>;

  /**
   * Returns the provided default `def` (if `Err`), or applies a function `f` to the contained value (if `Ok`).
   *
   * Arguments passed to `mapOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `mapOrElse`, which is lazily evaluated.
   */
  mapOr<U>(def: U, f: (ok: T) => U): U;

  /**
   * Maps a `Result<T, E>` to `U` by applying fallback function `def` to a contained `Err` value, or function `f` to a contained `Ok` value.
   *
   * This function can be used to unpack a successful result while handling an error.
   */
  mapOrElse<U>(def: (err: E) => U, f: (ok: T) => U): U;

  /**
   * Maps a `Result<T, E>` to `Result<T, F>` by applying a function `f` to a contained `Err` value, leaving an `Ok` value untouched.
   *
   * This function can be used to pass through a successful result while handling an error.
   */
  mapErr<F>(f: (err: E) => F): Result<T, F>;

  /**
   * Calls a function `f` with the contained success value if `Ok`.
   *
   * Returns the original result.
   */
  inspect(f: (ok: T) => void): Result<T, E>;

  /**
   * Calls a function `f` with the contained error value if `Err`.
   *
   * Returns the original result.
   */
  inspectErr(f: (err: E) => void): Result<T, E>;

  /**
   * Returns the contained success value if `Ok`.
   *
   * Throws an `ExpectationFailed` exception if the result is `Err`, using the custom message `msg`.
   */
  expect(msg: string): T;

  /**
   * Returns the contained success value if `Ok`.
   *
   * Throws a `Panic` exception if the result is `Err`.
   *
   * Because this function may panic, its use is generally discouraged. Panics are meant for unrecoverable errors.
   * Instead, prefer to handle the `Err` case explicitly, or call `unwrapOr` or `unwrapOrElse`.
   * If you expect the `Result` to be successful, prefer calling `expect` and specify the reason for your expectation.
   */
  unwrap(): T;

  /**
   * Returns the contained error value if `Err`.
   *
   * Throws an `ExpectationFailed` exception if the result is `Ok`, using the custom message `msg`.
   */
  expectErr(msg: string): E;

  /**
   * Returns the contained error value if `Err`.
   *
   * Throws a `Panic` exception if the result is `Ok`.
   *
   * Because this function may panic, its use is generally discouraged. Panics are meant for unrecoverable errors.
   * Instead, prefer to handle the `Ok` case explicitly.
   * If you expect the `Result` to fail, prefer calling `expectErr` and specify the reason for your expectation.
   */
  unwrapErr(): E;

  /**
   * Returns the contained success value, but never panics.
   *
   * This method can only be called on results with an `E` type of `never`.
   *
   * Unlike `unwrap`, this method is known to never panic, therefore it can be used instead of `unwrap` as a maintainability safeguard that will fail to compile if the error type of the result is later changed to an error that can actually occur.
   */
  intoOk(this: Result<T, never>): T;

  /**
   * Returns the contained failure value, but never panics.
   *
   * This method can only be called on results with a `T` type of `never`.
   *
   * Unlike `unwrapErr`, this method is known to never panic, therefore it can be used instead of `unwrapErr` as a maintainability safeguard that will fail to compile if the ok type of the result is later changed to a type that can actually occur.
   */
  intoErr(this: Result<never, E>): E;

  /**
   * Returns `res` if the result is `Ok`, otherwise returns the original `Err` value.
   *
   * Arguments passed to `and` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `andThen`, which is lazily evaluated.
   */
  and<U>(res: Result<U, E>): Result<U, E>;

  /**
   * Returns the result of calling function `f` if the result is `Ok`, otherwise returns the original `Err` value.
   *
   * This function can be used for control flow based on result values.
   */
  andThen<U, F = E>(f: (ok: T) => Result<U, F>): Result<U, E | F>;

  /**
   * Returns `res` if the result is `Err`, otherwise returns the original `Ok` value.
   *
   * Arguments passed to `or` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `orElse`, which is lazily evaluated.
   */
  or<F>(res: Result<T, F>): Result<T, F>;

  /**
   * Returns the result of calling function `f` if the result is `Err`, otherwise returns the original `Ok` value.
   *
   * This function can be used for control flow based on result values.
   */
  orElse<F, U = T>(f: (err: E) => Result<U, F>): Result<T | U, F>;

  /**
   * Returns the contained `Ok` value or a provided default `def` if `Err`.
   *
   * Arguments passed to `unwrapOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `unwrapOrElse`, which is lazily evaluated.
   */
  unwrapOr(def: T): T;

  /**
   * Returns the contained `Ok` value or computes it from function `f` if `Err`.
   */
  unwrapOrElse(f: (err: E) => T): T;

  /**
   * Match on each variant of `Result`.
   *
   * Unlike _Rust_, your match branches may return different types, though it is generally recommended to return the same type.
   *
   * @example
   * ```
   * import { type Result } from "crabuccino";
   *
   * const username: Result<string, Error> = getUserName();
   *
   * const sirName = username.match(
   *   (name) => `Sir ${name}`,
   *   (e) => {
   *     console.error("Failed to get user's name:", e);
   *     return "Sir NoName";
   *   }
   * );
   * ```
   */
  match<A, B = A>(ok: (t: T) => A, err: (e: E) => B): A | B;

  /**
   * Transposes a `Result` of an `Option` into an `Option` of a `Result`.
   *
   * `Ok(None)` will be mapped to `None`. `Ok(Some(_))` and `Err(_)` will be mapped to `Some(Ok(_))` and `Some(Err(_))`.
   */
  transpose<T>(this: Result<Option<T>, E>): Option<Result<T, E>>;

  /**
   * Removes one level of nesting - converts `Result<Result<T, E>, E>` to `Result<T, E>`.
   */
  flatten<T>(this: Result<Result<T, E>, E>): Result<T, E>;
}

/**
 * Represents a value that is either a success `Ok(T)` or a failure `Err(E)`.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * The `Ok(T)` variant of `Result<T, E>`.
 */
export class Ok<T, E> implements IResult<T, E> {
  /** Creates an `Ok(T)` variant of `Result<T, E>`. */
  constructor(private readonly value: T) {}
  toString() {
    return `Ok(${stringify(this.value)})`;
  }
  toJSON() {
    return {
      ResultVariant: "Ok",
      inner: this.value,
    };
  }
  // Node/Vitest will try to call '.inspect()' - override it
  [inspectSymbol]() {
    return this.toString();
  }

  /**
   * Get the success value contained within this `Ok`.
   *
   * @example
   * ```
   * if (res.isOk()) {
   *   doSomethingWith(res.inner());
   * }
   * ```
   */
  inner(): T {
    return this.value;
  }

  toAsync(): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(this));
  }
  isOk(): this is Ok<T, E> {
    return true;
  }
  isOkAnd(predicate: (ok: T) => boolean): boolean {
    return predicate(this.value);
  }
  isErr(): this is Err<T, E> {
    return false;
  }
  isErrAnd(_predicate: (err: E) => boolean): boolean {
    return false;
  }
  ok(): Some<T> {
    return new Some(this.value);
  }
  err(): None<E> {
    return new None();
  }
  map<U>(f: (ok: T) => U): Ok<U, E> {
    return new Ok(f(this.value));
  }
  mapOr<U>(_def: U, f: (ok: T) => U): U {
    return f(this.value);
  }
  mapOrElse<U>(_def: (err: E) => U, f: (ok: T) => U): U {
    return f(this.value);
  }
  mapErr<F>(_f: (err: E) => F): Ok<T, F> {
    // @ts-expect-error - the error type is irrelevant for Ok
    return this as Ok<T, F>;
  }
  inspect(f: (ok: T) => void): Ok<T, E> {
    f(this.value);
    return this;
  }
  inspectErr(_f: (err: E) => void): Ok<T, E> {
    return this;
  }
  expect(_msg: string): T {
    return this.value;
  }
  unwrap(): T {
    return this.value;
  }
  expectErr(msg: string): never {
    throw new ExpectationFailed(
      `${msg}: expected result to be an 'Err' but is an 'Ok' value: ${stringify(this.value)}`,
      this,
    );
  }
  unwrapErr(): never {
    throw new Panic(
      `Called 'Result.unwrapErr()' on an 'Ok' value: ${stringify(this.value)}`,
    );
  }
  intoOk(this: Ok<T, never>): T {
    return this.value;
  }
  intoErr(this: Ok<never, E>): never {
    throw new Panic(
      "Called 'Result.intoErr()' on an 'Ok'. This should never occur and indicates a violation of the method receiver's type constraints.",
    );
  }
  and<U>(res: Result<U, E>): Result<U, E> {
    return res;
  }
  andThen<U, F = E>(f: (ok: T) => Result<U, F>): Result<U, E | F> {
    return f(this.value);
  }
  or<F>(_res: Result<T, F>): Ok<T, F> {
    // @ts-expect-error - error type is irrelevant to Ok
    return this as Ok<T, F>;
  }
  orElse<F, U = T>(_f: (err: E) => Result<U, F>): Ok<T, F> {
    // @ts-expect-error - error type is irrelevant to Ok
    return this as Ok<T, F>;
  }
  unwrapOr(_def: T): T {
    return this.value;
  }
  unwrapOrElse(_f: (err: E) => T): T {
    return this.value;
  }
  match<A, B = A>(ok: (t: T) => A, _err: (e: E) => B): A | B {
    return ok(this.value);
  }
  transpose<T>(this: Result<Option<T>, E>): Option<Ok<T, E>> {
    const self = this as Ok<Option<T>, E>;
    if (self.value.isSome()) {
      return new Some(new Ok(self.value.inner()));
    }
    return new None();
  }
  flatten<T>(this: Result<Result<T, E>, E>): Result<T, E> {
    return (this as Ok<Result<T, E>, E>).value;
  }
}

/**
 * The `Err(T)` variant of `Result<T, E>`.
 */
export class Err<T, E> implements IResult<T, E> {
  /** Creates an `Err(E)` variant of `Result<T, E>`. */
  constructor(private readonly error: E) {}
  toString() {
    return `Err(${stringify(this.error)})`;
  }
  toJSON() {
    return {
      ResultVariant: "Err",
      inner: this.error,
    };
  }
  // Node/Vitest will try to call '.inspect()' - override it
  [inspectSymbol]() {
    return this.toString();
  }

  /**
   * Get the error value contained within this `Err`.
   *
   * @example
   * ```
   * if (res.isErr()) {
   *   handleTheError(res.inner());
   * }
   * ```
   */
  inner(): E {
    return this.error;
  }
  toAsync(): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(this));
  }

  isOk(): this is Ok<T, E> {
    return false;
  }
  isOkAnd(_predicate: (ok: T) => boolean): boolean {
    return false;
  }
  isErr(): this is Err<T, E> {
    return true;
  }
  isErrAnd(predicate: (err: E) => boolean): boolean {
    return predicate(this.error);
  }
  ok(): None<T> {
    return new None();
  }
  err(): Some<E> {
    return new Some(this.error);
  }
  map<U>(_f: (ok: T) => U): Err<U, E> {
    // @ts-expect-error - the okay type is irrelevant to Err
    return this as Err<U, E>;
  }
  mapOr<U>(def: U, _f: (ok: T) => U): U {
    return def;
  }
  mapOrElse<U>(def: (err: E) => U, _f: (ok: T) => U): U {
    return def(this.error);
  }
  mapErr<F>(f: (err: E) => F): Err<T, F> {
    return new Err(f(this.error));
  }
  inspect(_f: (ok: T) => void): Err<T, E> {
    return this;
  }
  inspectErr(f: (err: E) => void): Err<T, E> {
    f(this.error);
    return this;
  }
  expect(msg: string): never {
    throw new ExpectationFailed(
      `${msg}: expected result to be an 'Ok' but is an 'Err' value: ${stringify(this.error)}`,
      this,
    );
  }
  unwrap(): T {
    throw new Panic(
      `Called 'Result.unwrap()' on an 'Err' value: ${stringify(this.error)}`,
    );
  }
  expectErr(_msg: string): E {
    return this.error;
  }
  unwrapErr(): E {
    return this.error;
  }
  intoOk(this: Err<T, never>): never {
    throw new Panic(
      "Called 'Result.intoOk()' on an 'Err'. This should never occur and indicates a violation of the method receiver's type constraints.",
    );
  }

  intoErr(this: Err<never, E>): E {
    return this.error;
  }
  and<U>(_res: Result<U, E>): Err<U, E> {
    // @ts-expect-error - the okay type is irrelevant to Err
    return this as Err<U, E>;
  }
  andThen<U, F = E>(_f: (ok: T) => Result<U, F>): Err<U, E> {
    // @ts-expect-error - okay type is irrelevant for Err
    return this as Err<U, E>;
  }
  or<F>(res: Result<T, F>): Result<T, F> {
    return res;
  }
  orElse<F, U = T>(f: (err: E) => Result<U, F>): Result<T | U, F> {
    return f(this.error);
  }
  unwrapOr(def: T): T {
    return def;
  }
  unwrapOrElse(f: (err: E) => T): T {
    return f(this.error);
  }
  match<A, B = A>(_ok: (t: T) => A, err: (e: E) => B): A | B {
    return err(this.error);
  }
  transpose<T>(this: Result<Option<T>, E>): Some<Err<T, E>> {
    return new Some(this as Err<T, E>);
  }
  flatten<T>(this: Result<Result<T, E>, E>): Err<T, E> {
    return this as Err<T, E>;
  }
}
