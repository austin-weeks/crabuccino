import { Err, Ok, type Result } from "./result";
import { ExpectationFailed, Panic } from "./panic";
import { stringify } from "./stringify";

// Node/Vitest will try to call '.inspect()' - override it
export const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");

/**
 * Construct an `Option<T>` from a value of type `T` that may be `null` or `undefined`.
 *
 * If the value is `null` or `undefined`, a `None` variant will be returned, otherwise a `Some<T>` variant containing the non-nullish value will be returned.
 */
export function fromNullish<T>(v: T | null | undefined): Option<NonNullable<T>> {
  if (v === null || v === undefined) {
    return new None();
  }
  return new Some(v);
}

/**
 * Represents an optional value that is either `Some(T)` or `None`.
 */
export type Option<T> = Some<T> | None<T>;

interface IOption<T> {
  /**
   * Converts the option to an idiomatic JS optional value `T | undefined`.
   */
  toNullish(): T | undefined;

  /**
   * Match on each variant of `Option`.
   *
   * Unlike _Rust_, your match branches may return different types, though it is generally recommended to return the same type.
   *
   * @example
   * ```
   * import { Some, None } from "crabuccino";
   *
   * const doubled = new Some(5).match(
   *   (v) => v * 2, // the option is 'Some', so the some branch runs
   *   () => 0,
   * );
   * console.assert(doubled === 10);
   *
   * const tripled = new None().match(
   *   (v) => v * 3,
   *   () => 0,      // the option is 'None', so the none branch runs
   * );
   * console.assert(tripled === 0);
   * ```
   */
  match<A, B = A>(some: (val: T) => A, none: () => B): A | B;

  /**
   * Returns `true` if the option is a `Some` value.
   *
   * When this method returns `true`, _TypeScript_ narrows the type from `Option<T>` to `Some<T>`, allowing access to the `Some<T>.inner()` method to retrieve the contained value.
   *
   * When this method returns `false`, _TypeScript_ narrows the type from `Option<T>` to `None`.
   *
   * @example
   * ```
   * import { Some, type Option } from "crabuccino";
   *
   * const opt: Option<string> = new Some("hello");
   *
   * if (opt.isSome()) {
   *   console.assert(opt.inner() === "hello");
   * }
   * ```
   */
  isSome(): this is Some<T>;

  /**
   * Returns `true` if the option is a `Some` and the value inside of it matches a `predicate`.
   */
  isSomeAnd(predicate: (some: T) => boolean): boolean;

  /**
   * Returns `true` if the option is a `None` value.
   *
   * When this method returns `true`, _TypeScript_ narrows the type from `Option<T>` to `None`, indicating there is no contained value.
   *
   * When this method returns `false`, _TypeScript_ narrows the type from `Option<T>` to `Some<T>`.
   */
  isNone(): this is None<T>;

  /**
   * Returns `true` if the option is `None` or the value inside of it matches a `predicate`.
   */
  isNoneOr(predicate: (some: T) => boolean): boolean;

  /**
   * Returns the contained value if `Some`.
   *
   * Throws an `ExpectationFailed` exception if the option is `None` with a custom message `msg`.
   */
  expect(msg: string): T;

  /**
   * Returns the contained value if `Some`.
   *
   * Throws a `Panic` exception if the option is `None`.
   *
   * Because this function may panic, its use is generally discouraged. Panics are meant for unrecoverable errors.
   * Instead, prefer to handle the `None` case explicitly, or call `unwrapOr` or `unwrapOrElse`.
   * If you expect the `Option` to contain a value, prefer calling `expect` and specify the reason for your expectation.
   */
  unwrap(): T;

  /**
   * Returns the contained `Some` value or a provided default `def`.
   *
   * Arguments passed to `unwrapOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `unwrapOrElse`, which is lazily evaluated.
   */
  unwrapOr(def: T): T;

  /**
   * Returns the contained `Some` value or computes it from function `f` if `None`.
   */
  unwrapOrElse(f: () => T): T;

  /**
   * Maps an `Option<T>` to `Option<U>` by applying a function `f` to a contained value (if `Some`) or returns `None` (if `None`).
   */
  map<U>(f: (some: T) => U): Option<U>;

  /**
   * Calls a function `f` with the contained value if `Some`.
   *
   * Returns the original option.
   */
  inspect(f: (some: T) => void): Option<T>;

  /**
   * Returns the provided default result `def` (if `None`), or applies a function `f` to the contained value (if `Some`).
   *
   * Arguments passed to `mapOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `mapOrElse`, which is lazily evaluated.
   */
  mapOr<U>(def: U, f: (some: T) => U): U;

  /**
   * Computes a default function result `def` (if `None`), or applies a different function `f` to the contained value (if `Some`).
   */
  mapOrElse<U>(def: () => U, f: (some: T) => U): U;

  /**
   * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err)`.
   *
   * Arguments passed to `okOr` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `okOrElse`, which is lazily evaluated.
   */
  okOr<E>(err: E): Result<T, E>;

  /**
   * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`.
   */
  okOrElse<E>(err: () => E): Result<T, E>;

  /**
   * Returns `None` if the option is `None`, otherwise returns `optb`.
   *
   * Arguments passed to `and` are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `andThen`, which is lazily evaluated.
   */
  and<U>(optb: Option<U>): Option<U>;

  /**
   * Returns `None` if the option is `None`, otherwise calls `f` with the wrapped value and returns the result.
   */
  andThen<U>(f: (some: T) => Option<U>): Option<U>;

  /**
   * Returns `None` if the option is `None`, otherwise calls `predicate` with the wrapped value and returns:
   * - `Some(T)` if `predicate` returns true, and
   * - `None` if predicate returns false.
   */
  filter(predicate: (some: T) => boolean): Option<T>;

  /**
   * Returns the option if `Some`, otherwise returns `optb`.
   *
   * Arguments passed to or are eagerly evaluated; if you are passing the result of a function call, it is recommended to use `orElse`, which is lazily evaluated.
   */
  or(optb: Option<T>): Option<T>;

  /**
   * Returns the option if `Some`, otherwise calls `f` and returns the result.
   */
  orElse(f: () => Option<T>): Option<T>;

  /**
   * Returns `Some` if exactly one of `this`, `optb` is `Some`, otherwise returns `None`.
   */
  xor(optb: Option<T>): Option<T>;

  /**
   * Makes a tuple array of the wrapped value and the value in another `Option`.
   *
   * If this option is `Some(s)` and `other` is `Some(o)`, this method returns `Some([s, o])`. Otherwise, `None` is returned.
   */
  zip<U>(other: Option<U>): Option<[T, U]>;

  /**
   * Unzips an option containing a tuple array of two options.
   *
   * If `this` is `Some([a, b])` this method returns `[Some(a), Some(b)]`. Otherwise, `[None, None]` is returned.
   */
  unzip<A, B = A>(this: Option<[A, B]>): [Option<A>, Option<B>];

  /**
   * Transposes an `Option` of a `Result` into a `Result` of an `Option`.
   *
   * `Some(Ok(_))` is mapped to `Ok(Some(_))`, `Some(Err(_))` is mapped to `Err(_)`, and `None` will be mapped to `Ok(None)`.
   */
  transpose<T, E>(this: Option<Result<T, E>>): Result<Option<T>, E>;

  /**
   * Removes a single level of nesting - converts from `Option<Option<T>>` to `Option<T>`.
   */
  flatten<T>(this: Option<Option<T>>): Option<T>;
}

/**
 * The `Some(T)` variant of `Option<T>`.
 */
export class Some<T> implements IOption<T> {
  /** Creates a `Some(T)` variant of `Option<T>`. */
  constructor(private readonly value: T) {}

  /**
   * Get the value contained within this `Some`.
   *
   * @example
   * ```
   * if (opt.isSome()) {
   *   doSomethingWith(opt.inner());
   * }
   * ```
   */
  inner(): T {
    return this.value;
  }

  toString(): string {
    return `Some(${stringify(this.value)})`;
  }
  toJSON() {
    return {
      OptionVariant: "Some",
      inner: this.value,
    };
  }
  // Node/Vitest will try to call '.inspect()' - override it
  [inspectSymbol]() {
    return this.toString();
  }

  toNullish(): T {
    return this.value;
  }
  match<A, B = A>(some: (val: T) => A, _none: () => B): A | B {
    return some(this.value);
  }

  isSome(): this is Some<T> {
    return true;
  }
  isSomeAnd(predicate: (some: T) => boolean): boolean {
    return predicate(this.value);
  }
  isNone(): this is None<T> {
    return false;
  }
  isNoneOr(predicate: (some: T) => boolean): boolean {
    return predicate(this.value);
  }
  expect(_msg: string): T {
    return this.value;
  }
  unwrap(): T {
    return this.value;
  }
  unwrapOr(_def: T): T {
    return this.value;
  }
  unwrapOrElse(_f: () => T): T {
    return this.value;
  }
  map<U>(f: (some: T) => U): Some<U> {
    return new Some(f(this.value));
  }
  inspect(f: (some: T) => void): Some<T> {
    f(this.value);
    return this;
  }
  mapOr<U>(_def: U, f: (some: T) => U): U {
    return f(this.value);
  }
  mapOrElse<U>(_def: () => U, f: (some: T) => U): U {
    return f(this.value);
  }
  okOr<E>(_err: E): Ok<T, E> {
    return new Ok(this.value);
  }
  okOrElse<E>(_err: () => E): Ok<T, E> {
    return new Ok(this.value);
  }
  and<U>(optb: Option<U>): Option<U> {
    return optb;
  }
  andThen<U>(f: (some: T) => Option<U>): Option<U> {
    return f(this.value);
  }
  filter(predicate: (some: T) => boolean): Option<T> {
    return predicate(this.value) ? this : new None();
  }
  or(_optb: Option<T>): Some<T> {
    return this;
  }
  orElse(_f: () => Option<T>): Some<T> {
    return this;
  }
  xor(optb: Option<T>): Option<T> {
    if (optb.isSome()) {
      return new None();
    }
    return this;
  }
  zip<U>(other: Option<U>): Option<[T, U]> {
    if (other.isSome()) {
      return new Some<[T, U]>([this.value, other.value]);
    }
    return new None();
  }
  unzip<A, B = A>(this: Some<[A, B]>): [Some<A>, Some<B>] {
    return [new Some(this.value[0]), new Some(this.value[1])];
  }
  transpose<T, E>(this: Some<Result<T, E>>): Result<Some<T>, E> {
    if (this.value.isOk()) {
      return new Ok(new Some(this.value.inner()));
    }
    return new Err(this.value.inner());
  }
  flatten<T>(this: Some<Option<T>>): Option<T> {
    return this.value;
  }
}

/**
 * The `None` variant of `Option<T>`.
 *
 * _Note_: the `T` generic is required for type inference, but has no meaning on this variant.
 */
export class None<T> implements IOption<T> {
  // TODO: re-use a singleton to avoid allocations
  /** Creates a `None` variant of `Option<T>`. */
  constructor() {}
  toString(): string {
    return "None";
  }
  toJSON() {
    return {
      OptionVariant: "None",
    };
  }
  // Node/Vitest will try to call '.inspect()' - override it
  [inspectSymbol]() {
    return this.toString();
  }

  toNullish(): undefined {}
  match<A, B = A>(_some: (val: T) => A, none: () => B): A | B {
    return none();
  }

  isSome(): this is Some<T> {
    return false;
  }
  isSomeAnd(_predicate: (some: T) => boolean): boolean {
    return false;
  }
  isNone(): this is None<T> {
    return true;
  }
  isNoneOr(_predicate: (some: T) => boolean): boolean {
    return true;
  }
  expect(msg: string): never {
    throw new ExpectationFailed(`${msg}: expected 'Some', got 'None'`, this);
  }
  unwrap(): never {
    throw new Panic("Called 'Option.unwrap()' on a 'None' variant");
  }
  unwrapOr(def: T): T {
    return def;
  }
  unwrapOrElse(f: () => T): T {
    return f();
  }
  map<U>(_f: (some: T) => U): Option<U> {
    // @ts-expect-error - type T is irrelevant for None
    return this as Option<U>;
  }
  inspect(_f: (some: T) => void): None<T> {
    return this;
  }
  mapOr<U>(def: U, _f: (some: T) => U): U {
    return def;
  }
  mapOrElse<U>(def: () => U, _f: (some: T) => U): U {
    return def();
  }
  okOr<E>(err: E): Err<T, E> {
    return new Err(err);
  }
  okOrElse<E>(err: () => E): Err<T, E> {
    return new Err(err());
  }
  and<U>(_optb: Option<U>): None<U> {
    // @ts-expect-error - type T is irrelevant for None
    return this as None<U>;
  }
  andThen<U>(_f: (some: T) => Option<U>): None<U> {
    // @ts-expect-error - type T is irrelevant for None
    return this as None<U>;
  }
  filter(_predicate: (some: T) => boolean): None<T> {
    return this;
  }
  or(optb: Option<T>): Option<T> {
    return optb;
  }
  orElse(f: () => Option<T>): Option<T> {
    return f();
  }
  xor(optb: Option<T>): Option<T> {
    return optb;
  }
  zip<U>(_other: Option<U>): Option<[T, U]> {
    return this as Option<[T, U]>;
  }
  unzip<A, B = A>(this: None<[A, B]>): [None<A>, None<B>] {
    return [new None(), new None()];
  }
  transpose<T, E>(this: None<Result<T, E>>): Result<None<T>, E> {
    return new Ok(new None());
  }
  flatten<T>(this: None<Option<T>>): None<T> {
    return this as None<T>;
  }
}

/**
 * Construct a `Some(T)` variant of `Option<T>` containing a value of type `T`.
 *
 * Equivalent to `new Some(val)`.
 */
export function some<T>(val: T): Option<T> {
  return new Some(val);
}

/**
 * Construct a `None` variant of `Option<T>` containing no value.
 *
 * Equivalent to `new None()`.
 */
export function none<T>(): Option<T> {
  return new None();
}
