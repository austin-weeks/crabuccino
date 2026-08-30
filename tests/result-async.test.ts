import { describe, expect, it, vi } from "vitest";
import { ResultAsync } from "../src/result-async";
import { Err, Ok } from "../src/result";
import { inspectSymbol, None, Some } from "../src/option";
import { ExpectationFailed, Panic } from "../src/panic";
import { captureThrownAsync } from "./utils";

// TODO: MAKE SURE TO EXERCISE WITH BOTH SYNC AND ASYNC CALLBACKS

// Test Utils
function syncAndAsyncSpies() {
  return [vi.fn(), vi.fn(async () => {})];
}

function asyncOk<T>(ok: T): ResultAsync<T, never> {
  return new ResultAsync(Promise.resolve(new Ok(ok)));
}

function asyncErr<E>(err: E): ResultAsync<never, E> {
  return new ResultAsync(Promise.resolve(new Err(err)));
}

describe("ResultAsync", () => {
  describe("asPromise", () => {
    it("should return the underlying promise", () => {
      const promise = Promise.resolve(new Ok("okay"));
      expect(new ResultAsync(promise).asPromise()).toBe(promise);
    });
  });

  describe("ok", () => {
    it("should resolve with Some(T) if the pending result is Ok", async () => {
      const opt = await asyncOk("value").ok();
      expect(opt).toBeInstanceOf(Some);
      expect(opt.unwrap()).toEqual("value");
    });
    it("should resolve with None if the pending result is Err", async () => {
      const opt = await asyncErr("oops").ok();
      expect(opt).toBeInstanceOf(None);
    });
  });

  describe("err", () => {
    it("should resolve with Some(E) if the pending result is Err", async () => {
      const opt = await asyncErr("oops").err();
      expect(opt).toBeInstanceOf(Some);
      expect(opt.unwrap()).toEqual("oops");
    });
    it("should resolve with None if the pending result is Ok", async () => {
      const opt = await asyncOk("okay").err();
      expect(opt).toBeInstanceOf(None);
    });
  });

  describe("map", () => {
    describe("if Ok", () => {
      it.each([(v: string) => v + " world", async (v: string) => v + " world"])(
        "should return ResultAsync containing the mapped value",
        async mapper => {
          const mapped = asyncOk("hello").map(mapper);
          expect(mapped).toBeInstanceOf(ResultAsync);
          expect(await mapped.unwrap()).toEqual("hello world");
        },
      );
      it.each(syncAndAsyncSpies())(
        "should call the mapper with the contained value",
        async mapper => {
          const value = {};
          await asyncOk(value).map(mapper);
          expect(mapper).toHaveBeenCalledWith(value);
        },
      );
    });
    describe("if Err", () => {
      it.each([() => {}, async () => {}])(
        "should return ResultAsync contained the inner error",
        async mapper => {
          const mapped = asyncErr("oops").map(mapper);
          expect(mapped).toBeInstanceOf(ResultAsync);
          expect(await mapped.unwrapErr()).toEqual("oops");
        },
      );
      it.each(syncAndAsyncSpies())(
        "should not execute the mapper callback",
        async mapper => {
          await asyncErr("oops").map(mapper);
          expect(mapper).not.toHaveBeenCalled();
        },
      );
    });
  });

  describe("mapOr", () => {
    describe("if Ok", () => {
      it.each([(v: string) => v + " world", async (v: string) => v + " world"])(
        "should resolve to the mapped value",
        async mapper => {
          const p = asyncOk("hello").mapOr("default", mapper);
          expect(await p).toEqual("hello world");
        },
      );
      it.each(syncAndAsyncSpies())(
        "should call the mapper with the contained value",
        async mapper => {
          const value = {};
          await asyncOk(value).mapOr("default", mapper);
          expect(mapper).toHaveBeenCalledWith(value);
        },
      );
    });
    describe("if Err", () => {
      it.each([() => "", async () => ""])(
        "should resolve to the default value",
        async mapper => {
          const p = asyncErr("oops").mapOr("default", mapper);
          expect(await p).toEqual("default");
        },
      );
      it.each(syncAndAsyncSpies())(
        "should not execute the mapper callback",
        async mapper => {
          await asyncErr("oops").mapOr("", mapper);
          expect(mapper).not.toHaveBeenCalled();
        },
      );
    });
  });

  describe("mapOrElse", () => {
    describe("if Ok", () => {
      it.each([(v: string) => v + " world", async (v: string) => v + " world"])(
        "should resolve to the mapped value",
        async mapper => {
          const p = asyncOk("hello").mapOrElse(() => "", mapper);
          expect(await p).toEqual("hello world");
        },
      );
      it.each(syncAndAsyncSpies())(
        "should call the mapper with the contained value",
        async mapper => {
          const value = {};
          await asyncOk(value).mapOrElse(() => "", mapper);
          expect(mapper).toHaveBeenCalledWith(value);
        },
      );
      it.each(syncAndAsyncSpies())(
        "should not execute the default callback",
        async def => {
          await asyncOk("okay").mapOrElse(def, () => {});
          expect(def).not.toHaveBeenCalled();
        },
      );
    });
    describe("if Err", () => {
      it.each([() => "default", async () => "default"])(
        "should resolve to the default value",
        async def => {
          const p = asyncErr("oops").mapOrElse(def, () => "");
          expect(await p).toEqual("default");
        },
      );
      it.each(syncAndAsyncSpies())(
        "should call the default callback with the contained value",
        async def => {
          const error = new Error("oops");
          await asyncErr(error).mapOrElse(def, () => {});
          expect(def).toHaveBeenCalledWith(error);
        },
      );
      it.each(syncAndAsyncSpies())(
        "should not execute the mapper callback",
        async mapper => {
          await asyncErr("oops").mapOrElse(() => {}, mapper);
          expect(mapper).not.toHaveBeenCalled();
        },
      );
    });
  });

  describe("mapErr", () => {
    describe("if Ok", () => {
      it("should return ResultAsync resolving to the contained value", async () => {
        const mapped = asyncOk("okay").mapErr(() => {});
        expect(mapped).toBeInstanceOf(ResultAsync);
        expect(await mapped.unwrap()).toEqual("okay");
      });
      it.each(syncAndAsyncSpies())(
        "should not execute the mapper callback",
        async errMapper => {
          await asyncOk("okay").mapErr(errMapper);
          expect(errMapper).not.toHaveBeenCalled();
        },
      );
    });
    describe("if Err", () => {
      it.each([(e: string) => e + " daisy", async (e: string) => e + " daisy"])(
        "should return ResultAsync with the mapped error value",
        async errMapper => {
          const mapper = asyncErr("oopsie").mapErr(errMapper);
          expect(mapper).toBeInstanceOf(ResultAsync);
          expect(await mapper.unwrapErr()).toEqual("oopsie daisy");
        },
      );
      it.each(syncAndAsyncSpies())(
        "should call the mapper callback with the contained error value",
        async errMapper => {
          const error = new Error("oops");
          await asyncErr(error).mapErr(errMapper);
          expect(errMapper).toHaveBeenCalledWith(error);
        },
      );
    });
  });

  describe("inspect", () => {
    describe("if Ok", () => {
      it.each(syncAndAsyncSpies())(
        "should call the inspect callback with the contained value",
        async inspect => {
          const value = {};
          await asyncOk(value).inspect(inspect);
          expect(inspect).toHaveBeenCalledWith(value);
        },
      );
      it("should return ResultAsync resolving to the contained value", async () => {
        const inspected = asyncOk("okay").inspect(() => {});
        expect(inspected).toBeInstanceOf(ResultAsync);
        expect(await inspected.unwrap()).toEqual("okay");
      });
    });
    describe("if Err", () => {
      it("should return ResultAsync resolving to the contained error", async () => {
        const inspected = asyncErr("oops").inspect(() => {});
        expect(inspected).toBeInstanceOf(ResultAsync);
        expect(await inspected.unwrapErr()).toEqual("oops");
      });
      it.each(syncAndAsyncSpies())(
        "should not execute the inspect callback",
        async inspector => {
          await asyncErr("oops").inspect(inspector);
          expect(inspector).not.toHaveBeenCalled();
        },
      );
    });
  });

  describe("inspectErr", () => {
    describe("if Ok", () => {
      it("should return ResultAsync resolving to the contained value", async () => {
        const inspected = asyncOk("okay").inspectErr(() => {});
        expect(inspected).toBeInstanceOf(ResultAsync);
        expect(await inspected.unwrap()).toEqual("okay");
      });
      it.each(syncAndAsyncSpies())(
        "should not execute the inspect callback",
        async errInspector => {
          await asyncOk("okay").inspectErr(errInspector);
          expect(errInspector).not.toHaveBeenCalled();
        },
      );
    });
    describe("if Err", () => {
      it("should return ResultAsync resolving to the contained error", async () => {
        const inspected = asyncErr("oops").inspectErr(() => {});
        expect(inspected).toBeInstanceOf(ResultAsync);
        expect(await inspected.unwrapErr()).toEqual("oops");
      });
      it.each(syncAndAsyncSpies())(
        "should call the inspect callback with the contained error",
        async errInspector => {
          const error = new Error("oops");
          await asyncErr(error).inspectErr(errInspector);
          expect(errInspector).toHaveBeenCalledWith(error);
        },
      );
    });
  });

  describe("expect", () => {
    describe("if Ok", () => {
      it("should resolve to the contained value", async () => {
        expect(await asyncOk("okay").expect("")).toEqual("okay");
      });
      it("should not throw", async () => {
        await expect(asyncOk("okay").expect("")).resolves.not.toThrow();
      });
    });
    describe("if Err", () => {
      it("should throw an ExpectationFailed with the provided custom message", async () => {
        const err = new Err("oops");
        const e: ExpectationFailed = await captureThrownAsync(
          async () =>
            await new ResultAsync(Promise.resolve(err)).expect("custom message"),
        );
        expect(e).toBeInstanceOf(ExpectationFailed);
        expect(e.underlyingValue).toBe(err);
        expect(e.message).toEqual(
          "custom message: expected result to be an 'Ok' but is an 'Err' value: oops",
        );
      });
    });
  });

  describe("unwrap", () => {
    describe("if Ok", () => {
      it("should resolve to the contained value", async () => {
        expect(await asyncOk("okay").unwrap()).toEqual("okay");
      });
      it("should not throw", async () => {
        await expect(asyncOk("okay").unwrap()).resolves.not.toThrow();
      });
    });
    describe("if Err", () => {
      it("should throw a Panic", async () => {
        const e: Panic = await captureThrownAsync(async () => asyncErr("oops").unwrap());
        expect(e).toBeInstanceOf(Panic);
        expect(e.message).toEqual(
          "Called 'ResultAsync.unwrap()' on an 'Err' value: oops",
        );
      });
    });
  });

  describe("expectErr", () => {
    describe("if Ok", () => {
      it("should throw an ExpectationFailed with the provided custom message", async () => {
        const ok = new Ok("okay");
        const e: ExpectationFailed = await captureThrownAsync(
          async () =>
            await new ResultAsync(Promise.resolve(ok)).expectErr("custom message"),
        );
        expect(e).toBeInstanceOf(ExpectationFailed);
        expect(e.underlyingValue).toBe(ok);
        expect(e.message).toEqual(
          "custom message: expected result to be an 'Err' but is an 'Ok' value: okay",
        );
      });
    });
    describe("if Err", () => {
      it("should resolve with the contained error", async () => {
        expect(await asyncErr("oops").expectErr("")).toEqual("oops");
      });
      it("should not throw", async () => {
        await expect(asyncErr("oops").expectErr("")).resolves.not.toThrow();
      });
    });
  });

  describe("unwrapErr", () => {
    describe("if Ok", () => {
      it("should throw a Panic", async () => {
        const e: Panic = await captureThrownAsync(
          async () => await asyncOk("okay").unwrapErr(),
        );
        expect(e).toBeInstanceOf(Panic);
        expect(e.message).toEqual(
          "Called 'ResultAsync.unwrapErr()' on an 'Ok' value: okay",
        );
      });
    });
    describe("if Err", () => {
      it("should resolve with the contained error", async () => {
        expect(await asyncErr("oops").unwrapErr()).toEqual("oops");
      });
      it("should not throw", async () => {
        await expect(asyncErr("oops").unwrapErr()).resolves.not.toThrow();
      });
    });
  });

  describe("intoOk", () => {
    describe("if Ok", () => {
      it("should resolve with the contained value", async () => {
        expect(await asyncOk("okay").intoOk()).toEqual("okay");
      });
    });
    describe("if Err", () => {
      it("should throw a Panic", async () => {
        const e: Panic = await captureThrownAsync(
          // @ts-expect-error - this should be a compile error
          async () => await asyncErr("oops").intoOk(),
        );
        expect(e).toBeInstanceOf(Panic);
        expect(e.message).toEqual(
          "Called 'ResultAsync.intoOk()' on an 'Err'. This should never occur and indicates a violation of the method receiver's type constraints.",
        );
      });
    });
  });

  describe("intoErr", () => {
    describe("if Ok", () => {
      it("should throw a Panic", async () => {
        const e: Panic = await captureThrownAsync(
          // @ts-expect-error - this should be a compile error
          async () => await asyncOk("okay").intoErr(),
        );
        expect(e).toBeInstanceOf(Panic);
        expect(e.message).toEqual(
          "Called 'ResultAsync.intoErr()' on an 'Ok'. This should never occur and indicates a violation of the method receiver's type constraints.",
        );
      });
    });
    describe("if Err", () => {
      it("should resolve with the contained error", async () => {
        expect(await asyncErr("oops").intoErr()).toEqual("oops");
      });
    });
  });

  describe("andThen", () => {
    describe("if Ok", () => {
      it.each([() => new Ok("okay"), () => asyncOk("okay")])(
        "should return ResultAsync resolving to the result of the then callback",
        async then => {
          const chained = asyncOk("first result").andThen(then);
          expect(chained).toBeInstanceOf(ResultAsync);
          expect(await chained.unwrap()).toEqual("okay");
        },
      );
      it.each([vi.fn(), vi.fn(() => asyncOk(""))])(
        "should call the then callback with the contained value",
        async then => {
          const value = {};
          await asyncOk(value).andThen(then);
          expect(then).toHaveBeenCalledWith(value);
        },
      );
    });
    describe("if Err", () => {
      it("should return ResultAsync resolve to the contained error", async () => {
        const chained = asyncErr("oops").andThen(() => asyncOk(""));
        expect(chained).toBeInstanceOf(ResultAsync);
        expect(await chained.unwrapErr()).toEqual("oops");
      });
      it.each([vi.fn(), vi.fn(() => asyncOk(""))])(
        "should not execute the then callback",
        async then => {
          await asyncErr("oops").andThen(then);
          expect(then).not.toHaveBeenCalled();
        },
      );
    });
  });

  describe("orElse", () => {
    describe("if Ok", () => {
      it("should return ResultAsync resolving to the contained value", async () => {
        const chained = asyncOk("okay").orElse(() => asyncOk(""));
        expect(chained).toBeInstanceOf(ResultAsync);
        expect(await chained.unwrap()).toEqual("okay");
      });
      it.each([vi.fn(), vi.fn(() => asyncOk(""))])(
        "should not execute the else callback",
        async or => {
          await asyncOk("okay").orElse(or);
          expect(or).not.toHaveBeenCalled();
        },
      );
    });
    describe("if Err", () => {
      it.each([() => new Ok("okay"), () => asyncOk("okay")])(
        "should return ResultAsync resolving to the result of the else callback",
        async or => {
          const chained = asyncErr("oops").orElse(or);
          expect(chained).toBeInstanceOf(ResultAsync);
          expect(await chained.unwrap()).toEqual("okay");
        },
      );
      it.each([vi.fn(), vi.fn(() => asyncOk(""))])(
        "should call the else callback with the contained error",
        async or => {
          const error = new Error("oops");
          await asyncErr(error).orElse(or);
          expect(or).toHaveBeenCalledWith(error);
        },
      );
    });
  });

  describe("unwrapOr", () => {
    describe("if Ok", () => {
      it("should resolve to the contained value", async () => {
        expect(await asyncOk("okay").unwrapOr("default")).toEqual("okay");
      });
    });
    describe("if Err", () => {
      it("should resolve to the default value", async () => {
        expect(
          await (asyncErr("oops") as ResultAsync<string, string>).unwrapOr("default"),
        ).toEqual("default");
      });
    });
  });

  describe("unwrapOrElse", () => {
    describe("if Ok", () => {
      it("should resolve to the contained value", async () => {
        expect(await asyncOk("okay").unwrapOrElse(() => "")).toEqual("okay");
      });
      it.each(syncAndAsyncSpies())("should not execute the else callback", async def => {
        await asyncOk("okay").unwrapOrElse(def as () => string);
        expect(def).not.toHaveBeenCalled();
      });
    });
    describe("if Err", () => {
      it.each([() => "default", async () => "default"])(
        "should resolve to the value of the else callback",
        async def => {
          expect(
            await (asyncErr("oops") as ResultAsync<string, string>).unwrapOrElse(def),
          ).toEqual("default");
        },
      );
      it.each(syncAndAsyncSpies())(
        "should call the else callback with the contained error",
        async def => {
          const error = new Error("oops");
          await asyncErr(error).unwrapOrElse(def as unknown as () => never);
          expect(def).toHaveBeenCalledWith(error);
        },
      );
    });
  });

  describe("match", () => {
    describe("if Ok", () => {
      it.each([(v: string) => v + " world", async (v: string) => v + " world"])(
        "should resolve to the ok branch",
        async ok => {
          expect(await asyncOk("hello").match(ok, () => {})).toEqual("hello world");
        },
      );
      it.each(syncAndAsyncSpies())(
        "should call the ok callback with the contained value",
        async ok => {
          const value = {};
          await asyncOk(value).match(ok, () => {});
          expect(ok).toHaveBeenCalledWith(value);
        },
      );
      it.each(syncAndAsyncSpies())("should not execute the err branch", async err => {
        await asyncOk("okay").match(() => {}, err);
        expect(err).not.toHaveBeenCalled();
      });
    });
    describe("if Err", () => {
      it.each([(e: string) => e + " daisy", async (e: string) => e + " daisy"])(
        "should resolve to the err branch",
        async err => {
          expect(await asyncErr("oopsie").match(() => {}, err)).toEqual("oopsie daisy");
        },
      );
      it.each(syncAndAsyncSpies())(
        "should call the err callback with the contained error",
        async err => {
          const error = new Error("oops");
          await asyncErr(error).match(() => {}, err);
          expect(err).toHaveBeenCalledWith(error);
        },
      );
      it.each(syncAndAsyncSpies())("should not execute the ok branch", async ok => {
        await asyncErr("oops").match(ok, () => {});
        expect(ok).not.toHaveBeenCalled();
      });
    });
  });

  describe("transpose", () => {
    it("should resolve to None if Ok(None)", async () => {
      const opt = await asyncOk(new None()).transpose();
      expect(opt).toBeInstanceOf(None);
    });
    it("should resolve to Some(Ok(T)) if Ok(Some(T))", async () => {
      const opt = await asyncOk(new Some("value")).transpose();
      expect(opt).toBeInstanceOf(Some);
      const ok = opt.unwrap();
      expect(ok).toBeInstanceOf(Ok);
      expect(ok.unwrap()).toEqual("value");
    });
    it("should resolve to Some(Err(T)) if Err(E)", async () => {
      const opt = await asyncErr("value").transpose();
      expect(opt).toBeInstanceOf(Some);
      const err = opt.unwrap();
      expect(err).toBeInstanceOf(Err);
      expect(err.unwrapErr()).toEqual("value");
    });
  });

  describe("flatten", () => {
    it("should resolve to Ok(T) if Ok(Ok(T))", async () => {
      const res = asyncOk(asyncOk("okay")).flatten();
      expect(res).toBeInstanceOf(ResultAsync);
      expect(await res.unwrap()).toEqual("okay");
    });
    it("should resolve to Err(E) if Ok(Err(E))", async () => {
      const res = (
        asyncOk(asyncErr("oops")) as ResultAsync<ResultAsync<string, string>, string>
      ).flatten();
      expect(res).toBeInstanceOf(ResultAsync);
      expect(await res.unwrapErr()).toEqual("oops");
    });
    it("should resolve to Err(E) if Err(E)", async () => {
      const res = asyncErr("oops").flatten();
      expect(res).toBeInstanceOf(ResultAsync);
      expect(await res.unwrapErr()).toEqual("oops");
    });
  });

  describe("toString", () => {
    it("should return a string representation of ResultAsync", () => {
      expect(asyncOk("okay").toString()).toEqual("ResultAsync");
    });
  });

  describe("inspect symbol", () => {
    it("should delegate to toString()", () => {
      expect(asyncOk("okay")[inspectSymbol]()).toEqual("ResultAsync");
    });
  });

  describe("then", () => {
    it("should delegate to the underlying promise", () => {
      const promise = Promise.resolve(new Ok("okay"));
      const then = vi.spyOn(promise, "then");
      const onSuccess = vi.fn();
      const onFailure = vi.fn();
      new ResultAsync(promise).then(onSuccess, onFailure);
      expect(then).toHaveBeenCalledWith(onSuccess, onFailure);
    });
  });
});
