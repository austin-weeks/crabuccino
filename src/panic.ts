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

// Docs on crab.ts
export function panic(msg: string): never {
  throw new Panic(msg);
}

// TODO: should I export this or just remove?
export function recoverPanic(fn: () => void): Option<Panic> {
  try {
    fn();
  } catch (e: unknown) {
    if (e instanceof Panic) {
      return new Some(e);
    }
    throw e;
  }
  return new None();
}
