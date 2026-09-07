export { type Option, None, Some } from "./option";
export { type Result, Ok, Err } from "./result";
export { ResultAsync } from "./result-async";

import { crab } from "./crab";

// TODO: make all methods arrow functions to reduce token count.

/**
 * Utility functions for creating type variants and performing operations safely.
 *
 * To create instances of `Option<T>` or `Result<T, E>`, use `crab.Some(T)`, `crab.None`, `crab.Ok(T)` and `crab.Err(E)`.
 *
 * To safely use operations that may throw, use `crab.try()`, `crab.tryAsync()`, `crab.makeSafe()`, and `crab.makeSafeAsync()`.
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
 * - `crab.fromNullish` - convert a nullish value into an `Option`
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
 * import crab, { type Result } from "crabuccino";
 *
 * const ok: Result<string, Error> = crab.Ok("I'm a rustacean!");
 * ```
 */
export default { ...crab };
