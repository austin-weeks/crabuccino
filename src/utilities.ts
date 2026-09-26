import { Panic } from "./panic";
import { Err, Ok, type Result } from "./result";
import { ResultAsync } from "./result-async";
import { stringify } from "./stringify";

// Docs on crab object.
export function _try<T, E>(fn: () => T, errMapper: (e: unknown) => E): Result<T, E> {
  try {
    return new Ok(fn());
  } catch (e: unknown) {
    return new Err(errMapper(e));
  }
}

// Docs on crab object.
export function tryAsync<T, E>(
  fn: () => Promise<T>,
  errMapper: (e: unknown) => E | Promise<E>,
): ResultAsync<T, E> {
  return new ResultAsync(
    (async () => {
      try {
        return new Ok(await fn());
      } catch (e: unknown) {
        return new Err(await errMapper(e));
      }
    })(),
  );
}

// Docs on crab object.
export function combine<T, E>(results: readonly Result<T, E>[]): Result<T[], E> {
  const out = [];
  for (const res of results) {
    if (res.isErr()) {
      return res as Err<T[], E>;
    }
    out.push(res.inner());
  }
  return new Ok(out);
}

// Docs on crab object.
export function all<T, E>(results: readonly ResultAsync<T, E>[]): ResultAsync<T[], E> {
  return ResultAsync.fromSafe(async () => {
    const out: { val: T; ind: number }[] = [];

    // Track the index so we can remove as they settle.
    let pending = results.map((res, i) => ({
      res: res.then(res => ({ res, ind: i })),
      ind: i,
    }));
    while (pending.length > 0) {
      const { res, ind } = await Promise.race(pending.map(({ res }) => res));
      if (res.isErr()) {
        return res as Err<T[], E>;
      }
      out.push({ val: res.inner(), ind });
      pending = pending.filter(el => el.ind !== ind);
    }

    return new Ok(out.sort((a, b) => a.ind - b.ind).map(el => el.val));
  });
}

// It doesn't really make sense for this to return a ResultAsync even though I'd like it to.
// Docs on crab object.
export async function allSettled<T, E>(
  results: readonly ResultAsync<T, E>[],
): Promise<Result<T, E>[]> {
  const out: Result<T, E>[] = [];
  for (const res of await Promise.allSettled(results)) {
    if (res.status === "rejected") {
      throw new Panic(
        `A ResultAsync passed to 'crab.allSettled()' rejected: ${stringify(res.reason)}`,
      );
    }
    out.push(res.value);
  }
  return out;
}
