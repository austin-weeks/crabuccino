# 🦀 Crabuccino

<picture>
    <img src="./.github/assets/coffee-ferris.png" alt="Ferris the rustacean drinking a capuccino from their JavaScript mug." title="Art by @cerberussaturn07">
</picture>

A faithful TypeScript port of Rust's `Result<T, E>` and `Option<T>` types, plus `ResultAsync<T, E>` for representing asynchronous operations that may fail.

`ResultAsync` is like a `Promise<Result<T, E>>`, but with `Result`-style combinators for async workflows.

This library is for people already familiar with Rust's error-handling idioms, but it's open to anyone who wants explicit success/failure and optional values in TypeScript.
