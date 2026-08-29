import { None, Some, type Option } from "./option";

/**
 * The `Panic` Error is thrown by {@link panic} and the `unwrap` methods on `Option` and `Result` if they are
 * `None` or `Err` respectively. A `Panic` indicates that the program has reached an unrecoverable state.
 */
export class Panic extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Panic";
  }
}

/**
 * The `ExpectationFailed` Error is thrown by the `expect` methods on `Option` and `Result` if they are `None` or `Err`
 * respectively, as well as the `expectErr` method of `Result` if `Ok`.
 *
 * This is a more specific form of `Panic`, and indicates that some invariant in the program has been violated.
 */
export class ExpectationFailed extends Panic {
  /** The value that caused broke the expectation. */
  readonly underlyingValue: unknown;

  constructor(message: string, underlyingValue?: unknown) {
    super(message);
    this.name = "ExpectationFailed";
    this.underlyingValue = underlyingValue;
  }
}

/**
 * Throws a {@link Panic} Error.
 *
 * `panic` is closely tied with the `unwrap` method of both the `Option` and `Result` types. Both implementations
 * call `panic` when they are set to `None` or `Err` variants.
 *
 * `panic` should be used when your program reaches a truly unrecoverable state. Expected error states should be
 * modeled with the `Result` and `ResultAsync` types.
 *
 * @example
 * ```
 * import { panic } from "crabuccino";
 *
 * function divide(numerator: number, denominator: number): number {
 *   if (denominator === 0) {
 *     panic("cannot divide by zero");
 *   }
 *   return numerator / denominator;
 * }
 * ```
 */
export function panic(msg: string): never {
  throw new Panic(msg);
}

// Idk if I want this - maybe it'll be useful maybe not...
export function recoverPanic(f: () => void): Option<Panic> {
  try {
    f();
  } catch (e: unknown) {
    if (e instanceof Panic) {
      return new Some(e);
    }
    throw e;
  }
  return new None();
}
