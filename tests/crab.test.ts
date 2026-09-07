import { describe, expect, it, vi } from "vitest";
import { crab } from "../src/crab";
import { None, Some } from "../src/option";
import { Err, Ok, Result } from "../src/result";
import { ResultAsync } from "../src/result-async";
import { Panic } from "../src/panic";
import { captureThrownAsync } from "./utils";

describe("crab", () => {
  describe("Some", () => {
    it("should construct a Some(T)", () => {
      const v = crab.Some("value");
      expect(v).toBeInstanceOf(Some);
      expect(v.unwrap()).toEqual("value");
    });
  });

  describe("None", () => {
    it("should construct a None", () => {
      expect(crab.None).toBeInstanceOf(None);
    });
    it("should re-use the same None instance", () => {
      const a = crab.None;
      const b = crab.None;
      expect(a).toBe(b);
    });
  });

  describe("Ok", () => {
    it("should construct an Ok(T)", () => {
      const ok = crab.Ok("okay");
      expect(ok).toBeInstanceOf(Ok);
      expect(ok.unwrap()).toEqual("okay");
    });
  });

  describe("Err", () => {
    it("should construct an Err(E)", () => {
      const err = crab.Err("error");
      expect(err).toBeInstanceOf(Err);
      expect(err.unwrapErr()).toEqual("error");
    });
  });

  describe("OkAsync", () => {
    it("should construct a ResultAsync Ok(T)", async () => {
      const res = crab.OkAsync("okay");
      expect(res).toBeInstanceOf(ResultAsync);
      expect(await res.unwrap()).toEqual("okay");
    });
  });

  describe("ErrAsync", () => {
    it("should construct a ResultAsync Err(E)", async () => {
      const res = crab.ErrAsync("error");
      expect(res).toBeInstanceOf(ResultAsync);
      expect(await res.unwrapErr()).toEqual("error");
    });
  });

  describe("fromNullish", () => {
    it("should return None when given null", () => {
      expect(crab.fromNullish(null)).toBeInstanceOf(None);
    });
    it("should return None when given undefined", () => {
      expect(crab.fromNullish(undefined)).toBeInstanceOf(None);
    });
    it("should return Some(T) when given a non-nullish value", () => {
      const some = crab.fromNullish("value");
      expect(some).toBeInstanceOf(Some);
      expect(some.unwrap()).toEqual("value");
    });
  });

  describe("try", () => {
    it("should return Ok(T) if the function is successful", () => {
      const value = {};
      const res = crab.try(
        () => value,
        () => {},
      );
      expect(res).toBeInstanceOf(Ok);
      expect(res.unwrap()).toBe(value);
    });
    it("should return Err(E) if the function throws", () => {
      const error = new Error("oops");
      const res = crab.try(
        () => {
          throw error;
        },
        e => e,
      );
      expect(res).toBeInstanceOf(Err);
      expect(res.unwrapErr()).toBe(error);
    });
    it("should call the error mapper with the thrown error if the function throws", () => {
      const mapper = vi.fn();
      const error = new Error("oops");
      crab.try(() => {
        throw error;
      }, mapper);
      expect(mapper).toHaveBeenCalledWith(error);
    });
  });

  describe("tryAsync", () => {
    it("should return a ResultAsync resolving to Ok(T) if the function is successful", async () => {
      const value = {};
      const res = crab.tryAsync(
        async () => value,
        e => e,
      );
      expect(res).toBeInstanceOf(ResultAsync);
      expect(await res.unwrap()).toBe(value);
    });
    it.each([(e: unknown) => e, async (e: unknown) => e])(
      "should return a ResultAsync resolving to Err(E) if the function throws",
      async errMapper => {
        const error = new Error("oops");
        const res = crab.tryAsync(async () => {
          throw error;
        }, errMapper);
        expect(res).toBeInstanceOf(ResultAsync);
        expect(await res.unwrapErr()).toBe(error);
      },
    );
    it.each([vi.fn(), vi.fn(async () => {})])(
      "should call the error mapper with the thrown error if the function throws",
      async errMapper => {
        const error = new Error("oops");
        await crab.tryAsync(() => {
          throw error;
        }, errMapper);
        expect(errMapper).toHaveBeenCalledWith(error);
      },
    );
  });

  describe("makeSafe", () => {
    it("should return a function that returns Ok(T) if the function is successful", () => {
      const safe = crab.makeSafe(
        v => v,
        e => e,
      );
      const value = {};
      const res = safe(value);
      expect(res).toBeInstanceOf(Ok);
      expect(res.unwrap()).toBe(value);
    });
    it("should return a function that passes args to the wrapped function", () => {
      const fn = vi.fn();
      const safe = crab.makeSafe(fn, e => e);
      const value = {};
      safe(value, "string", 0);
      expect(fn).toHaveBeenCalledWith(value, "string", 0);
    });
    it("should return a function that returns Err(E) if the function throws", () => {
      const error = new Error("oops");
      const safe = crab.makeSafe(
        () => {
          throw error;
        },
        e => e,
      );
      const res = safe();
      expect(res).toBeInstanceOf(Err);
      expect(res.unwrapErr()).toBe(error);
    });
    it("should return a function that calls the error mapper with the thrown error if the function throws", () => {
      const errMapper = vi.fn();
      const error = new Error("oops");
      const safe = crab.makeSafe(() => {
        throw error;
      }, errMapper);
      safe();
      expect(errMapper).toHaveBeenCalledWith(error);
    });
  });

  describe("makeSafeAsync", () => {
    it("should return a function that returns a ResultAsync resolving to Ok(T) if the function is successful", async () => {
      const safe = crab.makeSafeAsync(
        async v => v,
        e => e,
      );
      const value = {};
      const res = safe(value);
      expect(res).toBeInstanceOf(ResultAsync);
      expect(await res.unwrap()).toBe(value);
    });
    it("should return a function that passes args to the wrapped function", async () => {
      const fn = vi.fn();
      const safe = crab.makeSafeAsync(fn, e => e);
      const value = {};
      await safe(value, "string", 0);
      expect(fn).toHaveBeenCalledWith(value, "string", 0);
    });
    it.each([(e: unknown) => e, async (e: unknown) => e])(
      "should return a function that returns a ResultAsync resolving to Err(E) if the function throws",
      async errMapper => {
        const error = new Error("oops");
        const safe = crab.makeSafeAsync(async () => {
          throw error;
        }, errMapper);
        const res = safe();
        expect(res).toBeInstanceOf(ResultAsync);
        expect(await res.unwrapErr()).toBe(error);
      },
    );
    it.each([vi.fn(), vi.fn(async () => {})])(
      "should return a function that calls the error mapper with the thrown error if the function throws",
      async errMapper => {
        const error = new Error("oops");
        const safe = crab.makeSafeAsync(async () => {
          throw error;
        }, errMapper);
        await safe();
        expect(errMapper).toHaveBeenCalledWith(error);
      },
    );
  });

  describe("shortCircuit", () => {
    it("should return Ok(T[]) if all results are successful", () => {
      const a = new Ok("a");
      const b = new Ok("b");
      const c = new Ok("c");

      const res = crab.shortCircuit([a, b, c]);
      expect(res).toBeInstanceOf(Ok);
      expect(res.unwrap()).toStrictEqual(["a", "b", "c"]);
    });
    it("should return Err(E) on the first encountered error", () => {
      const error1 = new Error("error");
      const error2 = new Error("another error");
      const res = crab.shortCircuit([new Err(error1), new Err(error2)]);
      expect(res).toBeInstanceOf(Err);
      expect(res.unwrapErr()).toBe(error1);
      expect(res.unwrapErr()).not.toBe(error2);
    });
  });

  describe("all", () => {
    function sleepyPromise<T, E>(result: Result<T, E>, ms: number) {
      return new Promise<Result<T, E>>(res => setTimeout(() => res(result), ms));
    }
    it("should return a promise resolving to Ok(T[]) if all results are successful with order preserved", async () => {
      // Oks that resolve out of order
      const results = [
        new ResultAsync(sleepyPromise(new Ok("a"), 100)),
        new ResultAsync(sleepyPromise(new Ok("b"), 50)),
        new ResultAsync(sleepyPromise(new Ok("c"), 200)),
        new ResultAsync(sleepyPromise(new Ok("d"), 0)),
        new ResultAsync(sleepyPromise(new Ok("e"), 10)),
      ];

      const res = await crab.all(results);
      expect(res).toBeInstanceOf(Ok);
      expect(res.unwrap().length).toEqual(5);
      expect(res.unwrap()[0]).toEqual("a");
      expect(res.unwrap()[1]).toEqual("b");
      expect(res.unwrap()[2]).toEqual("c");
      expect(res.unwrap()[3]).toEqual("d");
      expect(res.unwrap()[4]).toEqual("e");
    });

    it("should return a promise resolving to Err(E) with the first resolved error", async () => {
      const results = [
        new ResultAsync(sleepyPromise(new Err("second!"), 100)),
        new ResultAsync(sleepyPromise(new Err("first!"), 30)),
        new ResultAsync(sleepyPromise(new Err("third!"), 200)),
      ];

      const res = await crab.all(results);
      expect(res).toBeInstanceOf(Err);
      expect(res.unwrapErr()).toEqual("first!");
    });
  });

  describe("allSettled", () => {
    it("should return a promise resolving to a Result array with the awaited results with order preserved", async () => {
      const results = await crab.allSettled([
        crab.OkAsync("a"),
        crab.ErrAsync("oops!"),
        crab.OkAsync("b"),
        crab.ErrAsync("rats!"),
        crab.OkAsync("c"),
      ]);
      expect(results.length).toEqual(5);
      expect(results[0].unwrap()).toEqual("a");
      expect(results[1].unwrapErr()).toEqual("oops!");
      expect(results[2].unwrap()).toEqual("b");
      expect(results[3].unwrapErr()).toEqual("rats!");
      expect(results[4].unwrap()).toEqual("c");
    });
    it("should panic if any ResultAsync rejects", async () => {
      const res = crab.allSettled([new ResultAsync(Promise.reject("oops!"))]);
      const e: Panic = await captureThrownAsync(() => res);
      expect(e).toBeInstanceOf(Panic);
      expect(e.message).toEqual(
        "A ResultAsync passed to 'crab.allSettled()' rejected: oops!",
      );
    });
  });

  describe("panic", () => {
    it("should throw a Panic", () => {
      expect(() => crab.panic("oops")).toThrow("oops");
    });
  });
});
