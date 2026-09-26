import { None, Some, type Option } from "./option";
import { panic } from "./panic";
import { Err, Ok, type Result } from "./result";
import { ResultAsync } from "./result-async";
import { stringify } from "./stringify";
import { _try, all, allSettled, combine, tryAsync } from "./utilities";

/**
 * Utility functions for creating type variants and performing operations safely.
 *
 * To create instances of `Option<T>`, `Result<T, E>`, or `ResultAsync<T, E>`, use `crab.Some(T)`, `crab.None`, `crab.Ok(T)`, `crab.Err(E)`, `crab.OkAsync(T)`, and `crab.ErrAsync(E)`.
 *
 * To safely execute functions that may throw, use `crab.try()`, `crab.tryAsync()`, `crab.makeSafe()`, and `crab.makeSafeAsync()`.
 *
 * If you're working with arrays of `Result` or `ResultAsync`, use `crab.shortCircuit()`, `crab.all()`, or `crab.allSettled()` to combine results.
 *
 * - `crab.Ok` - create an `Ok(T)`
 * - `crab.OkAsync` - create a `ResultAsync` resolving to `Ok(T)`
 * - `crab.Err` - create an `Err(E)`
 * - `crab.ErrAsync` - create a `ResultAsync` resolving to `Err(E)`
 *
 * - `crab.Some` - create a `Some(T)`
 * - `crab.None` - get the `None` variant
 * - `crab.fromNullish` - convert a nullish value to an `Option`
 *
 * - `crab.try` - execute a function that may throw and return a `Result`
 * - `crab.tryAsync` - execute an async function that may throw and return a `ResultAsync`
 * - `crab.makeSafe` - wrap a throwing function so that it returns a `Result`
 * - `crab.makeSafeAsync` - wrap a throwing async function so that it returns a `ResultAsync`
 *
 * - `crab.shortCircuit` - convert `Result<T, E>[]` to `Result<T[], E>`
 * - `crab.all` - await an array of `ResultAsync<T, E>` and resolve to `Result<T[], E>`
 * - `crab.allSettled` - await an array of `ResultAsync<T, E>` regardless of success/failure and resolve to `Result<T, E>[]`
 *
 * - `crab.panic` - throw a `Panic` error
 *
 * @example
 * ```
 * import { crab, type Result } from "crabuccino";
 *
 * const ok: Result<string, Error> = crab.Ok("I'm a rustacean!");
 * ```
 */
export const crab = {
  /**
   * Construct an `Ok(T)` variant of `Result<T, E>`.
   *
   * Equivalent to `new Ok(val)`.
   */
  Ok: <T>(ok: T) => new Ok<T, never>(ok),

  /**
   * Construct an `Ok(T)` variant of `ResultAsync<T, E>` that resolves to `Result<T, E>`.
   */
  OkAsync: <T>(ok: T) => new ResultAsync<T, never>(Promise.resolve(new Ok(ok))),

  /**
   * Construct an `Err(E)` variant of `Result<T, E>`.
   *
   * Equivalent to `new Err(error)`.
   */
  Err: <E>(err: E) => new Err<never, E>(err),

  /**
   * Construct an `Err(E)` variant of `ResultAsync<T, E>` that resolves to `Result<T, E>`.
   */
  ErrAsync: <E>(err: E) => new ResultAsync<never, E>(Promise.resolve(new Err(err))),

  /**
   * Construct a `Some(T)` variant of `Option<T>` containing a value of type `T`.
   *
   * Equivalent to `new Some(val)`.
   */
  Some: <T>(val: T) => new Some(val),

  /**
   * The `None` variant of `Option<T>` containing no value.
   *
   * Equivalent to `new None()`.
   */
  None: new None<never>(),

  /**
   * Construct an `Option<T>` from a value of type `T` that may be `null` or `undefined`.
   *
   * If the value is `null` or `undefined`, a `None` variant will be returned, otherwise a `Some<T>` variant containing the non-nullish value will be returned.
   */
  fromNullish: <T>(v: T | null | undefined): Option<NonNullable<T>> => {
    if (v === null || v === undefined) {
      return new None();
    }
    return new Some(v);
  },

  /**
   * Safely executes a function `fn` that may throw, returning `Ok` if the function is successful or `Err` if the function throws.
   *
   * The provided `errMapper` is called if the function throws, and is responsible for converting the thrown value into a typed error of your choice.
   *
   * This function is useful for one-off operations. For frequently executed functions, try {@link crab.makeSafe}.
   *
   * To safely execute an async function, use {@link crab.tryAsync}.
   */
  try: _try,

  /**
   * Safely executes an async function `fn` that may throw, returning a promise that resolves to `Ok` if the function is successful or `Err` if the function throws.
   *
   * The provided `errMapper` is called if the function throws, and is responsible for converting the thrown value into a typed error of your choice.
   *
   * This function is useful for one-off operations. For frequently executed functions, try {@link crab.makeSafeAsync}.
   *
   * To safely execute a synchronous function, use {@link crab.try}.
   */
  tryAsync,

  /**
   * Wraps a potentially throwing function in a safe function that returns `Ok` on success or `Err` if the wrapped function throws.
   *
   * The provided `errMapper` is called when the wrapped function throws, and is responsible for converting the thrown value into a typed error of your choice.
   *
   * This function is useful for interfacing with third-party code that may throw on failure.
   *
   * To wrap an async function, use {@link crab.makeSafeAsync}.
   *
   * @example
   * ```
   * import { crab } from "crabuccino";
   *
   * const safeParse = crab.makeSafe(JSON.parse, e => new ParseError(e));
   *
   * const res = safeParse('{"foo": "bar"}');
   * console.assert(res.unwrap() === { foo: "bar" });
   * ```
   */
  makeSafe:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T, E, A extends any[]>(
        fn: (...args: A) => T,
        errMapper: (e: unknown) => E,
      ): ((...args: A) => Result<T, E>) =>
      (...args) =>
        _try(() => fn(...args), errMapper),

  /**
   * Wraps a potentially throwing async function in a safe function that returns a `ResultAsync` resolving to `Ok` on success or `Err` if the wrapped function throws.
   *
   * The provided `errMapper` is called when the wrapped function throws, and is responsible for converting the thrown value into a typed error of your choice.
   *
   * This function is useful for interfacing with third-party asynchronos code that may throw on failure.
   *
   * To wrap a synchronous function, use {@link crab.makeSafe}.
   *
   * @example
   * ```
   * import { crab } from "crabuccino";
   *
   * const safeFetch = crab.makeSafeAsync(fetch, e => new FetchError(e));
   * const safeRespJson = crab.makeSafeAsync(
   *   (r: Response) => r.json(), e => new DeserializeError(e),
   * );
   *
   * const res = await safeFetch("https://httpbin.org/json").andThen(safeRespJson);
   *
   * console.assert(res.unwrap().slideshow.author === "Yours Truly"]);
   * ```
   */
  makeSafeAsync:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T, E, A extends any[]>(
        fn: (...args: A) => Promise<T>,
        errMapper: (e: unknown) => E | Promise<E>,
      ): ((...args: A) => ResultAsync<T, E>) =>
      (...args) =>
        tryAsync(() => fn(...args), errMapper),

  /**
   * Convert a value `e` of type `unknown` to an `Error`. Returns the value unchanged if already an `Error` instance, otherwise returns a new `Error` instance wrapping the value.
   *
   * This function is useful as the `errMapper` arguments to {@link crab.try}, {@link crab.tryAsync}, {@link crab.makeSafe}, and {@link crab.makeSafeAsync}.
   *
   * @example
   * ```
   * import { crab, type Result } from "crabuccino";
   *
   * const res: Result<number, Error> = crab.try(() => 2, crab.unknownToError);
   * ```
   */
  unknownToError: (e: unknown) => {
    if (e instanceof Error) {
      return e;
    }
    return new Error(stringify(e, false), { cause: e });
  },

  /**
   * Given an array of `Result<T, E>`, returns a `Result<T[], E>`, where an `Ok` value contains the accumulated `Ok` results, and an `Err` value contains the first encountered `Err` result.
   *
   * This short circuits, meaning only the _first_ encountered `Err` value is returned. This makes it useful for all-or-nothing operations where a failure in one operation means a failure of all operations.
   *
   * For the async version of this function, see {@link crab.all}.
   */
  shortCircuit: combine,

  /**
   * The typesafe version of `Promise.all`.
   *
   * Given an array of `ResultAsync<T, E>`, returns a `ResultAsync<T[], E>`, where an `Ok` value contains the accumulated `Ok` results, and an `Err` value contains the first encountered `Err` result.
   *
   * Similar to `Promise.all`, this short circuits, meaning only the _first_ resolved `Err` value is returned.
   *
   * To await all results regardless of whether they succeed, use {@link crab.allSettled}.
   */
  all,

  /**
   * The typesafe version of `Promise.allSettled`.
   *
   * Given an array of `ResultAsync<T, E>`, returns a promise resolving to `Result<T, E>[]`.
   *
   * Similar to `Promise.allSettled`, this waits for _all_ async results to finish regardless of whether they succeed.
   *
   * To abort on the first encountered `Err`, use {@link crab.all}.
   */
  allSettled,

  /**
   * Throws a `Panic` error.
   *
   * `panic` is closely tied with the `unwrap` methods on the `Option`, `Result`, and `ResultAsync` types. Implementations call `panic` when they are not the expected variants.
   *
   * `panic` should only be used when your program reaches a truly unrecoverable state. Expected error states should be modeled with the `Result` and `ResultAsync` types.
   *
   * @example
   * ```
   * import { crab } from "crabuccino";
   *
   * function divide(numerator: number, denominator: number): number {
   *   if (denominator === 0) {
   *     crab.panic("cannot divide by zero");
   *   }
   *   return numerator / denominator;
   * }
   * ```
   */
  panic,
} as const;
