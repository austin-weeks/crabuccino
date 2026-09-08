# Crabuccino 🦀☕️

[![Package Version](https://img.shields.io/npm/v/crabuccino?logo=npm)](https://www.npmjs.org/package/crabuccino)
![GitHub License](https://img.shields.io/github/license/austin-weeks/crabuccino)
![Package Downloads](https://img.shields.io/npm/dm/crabuccino)
[![Code Coverage](https://img.shields.io/badge/coverage-100%25-dark_green)](https://github.com/austin-weeks/crabuccino/tree/main/tests)

<picture>
  <img
    src="https://raw.githubusercontent.com/austin-weeks/crabuccino/main/.github/assets/coffee-ferris.png"
    alt="Ferris the rustacean drinking a capuccino from their JavaScript mug."
    title="Art by @cerberussaturn07"
  >
</picture>

A faithful TypeScript port of Rust's `Result<T, E>` and `Option<T>` types, plus `ResultAsync<T, E>` for representing asynchronous operations that may fail.

`ResultAsync` is like a `Promise<Result<T, E>>`, but with `Result`-style combinators for async workflows.

This library is designed for those already familiar with Rust's approach to error-handling, but it's a great choice for anyone looking to _encode failure states directly into types._

## Installation

```sh
pnpm add crabuccino
# or
npm install crabuccino
# or
bun add crabuccino
```

## Usage

Use the library's default `crab` export to create variants of `Result`, `Option`, and `ResultAsync`. Then, use the methods available on each type just like you would in Rust!

```typescript
import crab, { type Result, type Option, type ResultAsync } from "crabuccino";

const res: Result<number, Error> = crab.Ok(5);

const doubledRes: Result<number, string> = res
  .mapErr(err => err.message)
  .inspectErr(console.error)
  .map(num => num * 2);

const opt: Option<number> = crab.None;

const num: number = opt.unwrapOrElse(() => 0);

const pendingRes: ResultAsync<string, "not-found"> = crab.ErrAsync("not-found");

const err = await pendingRes.expectErr("should be an error");
```

### Interfacing with Throwing Functions

You can use `crab` to interface with throwing functions.

```typescript
import crab, { type Result } from "crabuccino";

const res: Result<number, Error> = crab.try(
  () => parseInt("8"),
  e => new Error(`Failed to parse string: ${e}`),
);
console.assert(parsed.unwrap() === 8);

const safeJsonParse = crab.makeSafe(
  JSON.parse,
  e => new Error(`Failed to parse object: ${e}`),
);

const res: Result<unknown, Error> = safeJsonParse('{"foo": bar }');
console.assert(res.unwrap() === { foo: "bar" });
```

### Matching

You can also match on variants!

```typescript
import crab, { type Option, type Result } from "crabuccino";

const opt: Option<string> = crab.Some("Ferris");

const rusty = opt.match(
  s => `${s} the crab`,
  () => "Somebody the crab",
);

const res: Result<number, Error> = crab.Err("oops!");
res.match(
  num => console.log("Number:", num),
  err => console.error("Error:", err),
);
```

### Type Narrowing

Since JavaScript doesn't have pattern matching like `if let Some(val) = result`, we use type-guard methods that allow TypeScript to narrow the type of the underlying variant and allow type-safe access to the contained values.

```typescript
import crab, { type Result, type Option } from "crabuccino";

const opt: Option<string> = crab.Some("some");
if (opt.isSome()) {
  console.assert(typeof opt.inner() === "string");
}

const res: Result<string, Error> = crab.Ok("okay");
if (res.isOk()) {
  console.assert(typeof res.inner() === "string");
}
if (res.isErr()) {
  console.assert(res.inner() instanceof Error);
}
```

### Working with Asynchronous Code

Crabuccino provides the `ResultAsync` type which acts like a promise of a `Result`. It exposes the same methods as a standard `Result`!

```typescript
import crab, { type ResultAsync } from "crabuccino";

function fetchUser(id: string): ResultAsync<User, Error> {
  return crab.tryAsync(
    () => fetch(`/api/users/${id}`).then(r => r.json()),
    e => new Error(`Failed to fetch user: ${e}`),
  );
}

const userName = await fetchUser("user-1738")
  .map(u => u.firstName)
  .unwrap();
console.assert(userName === "Willie");
```

You can also await `ResultAsync` in bulk similar to `Promise.all`/`Promise.allSettled`.

```typescript
import crab, { type Result, type ResultAsync } from "crabuccino";

const pendingCalculations: ResultAsync<number, Error> = [/* ... */];

const calcsOrErr: Result<number[], Error> = await crab.all(pendingCalculations);

const allCalcs: Result<number, Error>[] = await crab.allSettled(pendingCalculations);
```

## Acknowledgements

This library is based on the [Rust standard library](https://doc.rust-lang.org/std/) and is inspired by [`neverthrow`](https://github.com/supermacro/neverthrow).
