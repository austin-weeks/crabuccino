import { describe, expect, it, vi } from "vitest";
import { Ok, Err, type Result } from "../src/result";
import { inspectSymbol, None, Some, type Option } from "../src/option";
import { ExpectationFailed, Panic } from "../src/panic";
import { captureThrown } from "./utils";

describe("Result", () => {
  describe("Ok", () => {
    describe("inner", () => {
      it("should return the contained success value", () => {
        const inner = {};
        expect(new Ok(inner).inner()).toBe(inner);
      });
    });

    describe("toAsync", () => {
      it("should constuct a ResultAsync that resolves to self", async () => {
        const ok = new Ok("okay");
        expect(await ok.toAsync()).toBe(ok);
      });
      it("should use Promise.resolve to create an immediately resolved promise", () => {
        vi.spyOn(Promise, "resolve");
        const ok = new Ok("okay");
        ok.toAsync();
        expect(Promise.resolve).toHaveBeenCalledWith(ok);
        vi.restoreAllMocks();
      });
    });

    describe("isOk", () => {
      it("should return true", () => {
        expect(new Ok("").isOk()).toBe(true);
      });
    });

    describe("isOkAnd", () => {
      it("should return true if the predicate returns true", () => {
        expect(new Ok("").isOkAnd(() => true)).toBe(true);
      });
      it("should return false if the predicate returns false", () => {
        expect(new Ok("").isOkAnd(() => false)).toBe(false);
      });
      it("should call the predicate with the contained value", () => {
        const predicate = vi.fn(() => true);
        new Ok("okay").isOkAnd(predicate);
        expect(predicate).toHaveBeenCalledWith("okay");
      });
    });

    describe("isErr", () => {
      it("should return false", () => {
        expect(new Ok("").isErr()).toBe(false);
      });
    });

    describe("isErrAnd", () => {
      it("should return false", () => {
        expect(new Ok("").isErrAnd(() => true)).toBe(false);
      });
      it("should not execute the provided predicate", () => {
        const predicate = vi.fn();
        new Ok("").isErrAnd(predicate);
        expect(predicate).not.toHaveBeenCalled();
      });
    });

    describe("ok", () => {
      it("should return Some(T)", () => {
        const opt = new Ok("okay").ok();
        expect(opt).toBeInstanceOf(Some);
        expect(opt.inner()).toEqual("okay");
      });
    });

    describe("err", () => {
      it("should return None", () => {
        expect(new Ok("").err()).toBeInstanceOf(None);
      });
    });

    describe("map", () => {
      it("should return a result containing the mapped inner value", () => {
        const res = new Ok("hello").map(v => v + " world");
        expect(res).toBeInstanceOf(Ok);
        expect(res.inner()).toEqual("hello world");
      });
    });

    describe("mapOr", () => {
      it("should return the mapped inner value", () => {
        expect(new Ok("hello").mapOr("", v => v + " world")).toEqual("hello world");
      });
    });

    describe("mapOrElse", () => {
      it("should return the mapped inner value", () => {
        expect(
          new Ok("hello").mapOrElse(
            () => "",
            v => v + " world",
          ),
        ).toEqual("hello world");
      });
      it("should not execute the default callback", () => {
        const def = vi.fn();
        new Ok("").mapOrElse(def, () => {});
        expect(def).not.toHaveBeenCalled();
      });
    });

    describe("mapErr", () => {
      it("should return self", () => {
        const ok = new Ok("okay");
        expect(ok.mapErr(() => {})).toBe(ok);
      });
      it("should not execute the err mapper", () => {
        const mapper = vi.fn();
        new Ok("").mapErr(mapper);
        expect(mapper).not.toHaveBeenCalled();
      });
    });

    describe("inspect", () => {
      it("should return self", () => {
        const ok = new Ok("okay");
        expect(ok.inspect(() => {})).toBe(ok);
      });
      it("should execute the callback with the contained value", () => {
        const inspect = vi.fn();
        new Ok("okay").inspect(inspect);
        expect(inspect).toHaveBeenCalledWith("okay");
      });
    });

    describe("inspectErr", () => {
      it("should return self", () => {
        const ok = new Ok("okay");
        expect(ok.inspectErr(() => {})).toBe(ok);
      });
      it("should not execute the error inspector", () => {
        const inspect = vi.fn();
        new Ok("okay").inspectErr(inspect);
        expect(inspect).not.toHaveBeenCalled();
      });
    });

    describe("expect", () => {
      it("should return the contained value", () => {
        expect(new Ok("okay").expect("")).toEqual("okay");
      });
      it("should not throw", () => {
        expect(() => new Ok("okay").expect("")).not.toThrow();
      });
    });

    describe("unwrap", () => {
      it("should return the contained value", () => {
        expect(new Ok("okay").unwrap()).toEqual("okay");
      });
      it("should not throw", () => {
        expect(() => new Ok("okay").unwrap()).not.toThrow();
      });
    });

    describe("expectErr", () => {
      it("should throw an ExpectationFailed with the custom message", () => {
        const ok = new Ok("okay");
        const e: ExpectationFailed = captureThrown(() => ok.expectErr("custom message"));
        expect(e).toBeInstanceOf(ExpectationFailed);
        expect(e.underlyingValue).toBe(ok);
        expect(e.message).toEqual(
          "custom message: expected result to be an 'Err' but is an 'Ok' value: okay",
        );
      });
    });

    describe("unwrapErr", () => {
      it("should throw a Panic", () => {
        const e: Panic = captureThrown(() => new Ok("okay").unwrapErr());
        expect(e).toBeInstanceOf(Panic);
        expect(e.message).toEqual("Called 'Result.unwrapErr()' on an 'Ok' value: okay");
      });
    });

    describe("intoOk", () => {
      it("should should return the contained value", () => {
        expect(new Ok<string, never>("okay").intoOk()).toEqual("okay");
      });
    });

    describe("intoErr", () => {
      it("should throw a Panic", () => {
        const e: Panic = captureThrown(() =>
          // @ts-expect-error - this should be a compile error but we're forcing calling it
          new Ok("value").intoErr(),
        );
        expect(e).toBeInstanceOf(Panic);
        expect(e.message).toEqual(
          "Called 'Result.intoErr()' on an 'Ok'. This should never occur and indicates a violation of the method receiver's type constraints.",
        );
      });
    });

    describe("and", () => {
      it.each([new Ok("other"), new Err("other")])(
        "should return the other result",
        other => {
          expect(new Ok("okay").and(other)).toBe(other);
        },
      );
    });

    describe.each([new Ok("other"), new Err("other")])("andThen", other => {
      it("should return the result of the provided callback", () => {
        expect(new Ok("okay").andThen(() => other)).toBe(other);
      });
      it("should call the then callback with the contained value", () => {
        const then = vi.fn(() => new Ok(""));
        new Ok("okay").andThen(then);
        expect(then).toHaveBeenCalledWith("okay");
      });
    });

    describe("or", () => {
      it.each([new Ok<string, string>("other"), new Err<string, string>("other")])(
        "should return self",
        other => {
          const ok = new Ok("okay");
          expect(ok.or(other)).toBe(ok);
        },
      );
    });

    describe("orElse", () => {
      it.each([new Ok("other"), new Err("other")])("should return self", other => {
        const ok = new Ok("okay");
        expect(ok.orElse(() => other)).toBe(ok);
      });
      it("should not execute the else callback", () => {
        const or = vi.fn();
        new Ok("okay").orElse(or);
        expect(or).not.toHaveBeenCalled();
      });
    });

    describe("unwrapOr", () => {
      it("should return the contained value", () => {
        expect(new Ok("okay").unwrapOr("")).toEqual("okay");
      });
    });

    describe("unwrapOrElse", () => {
      it("should return the contained value", () => {
        expect(new Ok("okay").unwrapOrElse(() => "")).toEqual("okay");
      });
      it("should not execute the else callback", () => {
        const or = vi.fn();
        new Ok("okay").unwrapOrElse(or);
        expect(or).not.toHaveBeenCalled();
      });
    });

    describe("match", () => {
      it("should return the result of the ok branch", () => {
        expect(
          new Ok("hello").match(
            v => v + " world",
            () => "",
          ),
        ).toEqual("hello world");
      });
      it("should not execute the err branch", () => {
        const err = vi.fn();
        new Ok("okay").match(() => "", err);
        expect(err).not.toHaveBeenCalled();
      });
    });

    describe("transpose", () => {
      it("should return Some(Ok(T)) if the contained value is Some", () => {
        const opt = new Ok(new Some("value")).transpose();
        expect(opt).toBeInstanceOf(Some);
        expect(opt.unwrap()).toBeInstanceOf(Ok);
        expect(opt.unwrap().inner()).toEqual("value");
      });
      it("should return None if the contained values is None", () => {
        expect(new Ok(new None()).transpose()).toBeInstanceOf(None);
      });
    });

    describe("flatten", () => {
      it.each([new Ok("inner"), new Err("inner")])(
        "should return the contained value",
        inner => {
          expect(new Ok(inner).flatten()).toBe(inner);
        },
      );
    });

    describe("toString", () => {
      it("should return a string representation of Ok(T)", () => {
        expect(new Ok("okay").toString()).toEqual("Ok(okay)");
      });
    });

    describe("toJSON", () => {
      it("should serialize the Ok", () => {
        expect(new Ok("okay").toJSON()).toEqual({
          ResultVariant: "Ok",
          inner: "okay",
        });
      });
    });

    describe("inspect symbol", () => {
      it("should delegate to toString", () => {
        const ok = new Ok("okay");
        expect(ok[inspectSymbol]()).toEqual(ok.toString());
      });
    });
  });

  describe("Err", () => {
    describe("inner", () => {
      it("should return the contained failure value", () => {
        const inner = {};
        expect(new Err(inner).inner()).toBe(inner);
      });
    });

    describe("toAsync", () => {
      it("should constuct a ResultAsync that resolves to self", async () => {
        const err = new Err("error");
        expect(await err.toAsync()).toBe(err);
      });
      it("should use Promise.resolve to create an immediately resolved promise", () => {
        vi.spyOn(Promise, "resolve");
        const err = new Err("error");
        err.toAsync();
        expect(Promise.resolve).toHaveBeenCalledWith(err);
        vi.restoreAllMocks();
      });
    });

    describe("isOk", () => {
      it("should return false", () => {
        expect(new Err("error").isOk()).toBe(false);
      });
    });

    describe("isOkAnd", () => {
      it("should return false", () => {
        expect(new Err("error").isOkAnd(() => true)).toBe(false);
      });
      it("should not execute the predicate", () => {
        const predicate = vi.fn();
        new Err("error").isOkAnd(predicate);
        expect(predicate).not.toHaveBeenCalled();
      });
    });

    describe("isErr", () => {
      it("should return true", () => {
        expect(new Err("error").isErr()).toBe(true);
      });
    });

    describe("isErrAnd", () => {
      it("should return true if the predicate returns true", () => {
        expect(new Err("error").isErrAnd(() => true)).toBe(true);
      });
      it("should return false if the predicate returns false", () => {
        expect(new Err("error").isErrAnd(() => false)).toBe(false);
      });
      it("should call the predicate with the contained failure value", () => {
        const predicate = vi.fn(() => true);
        new Err("error").isErrAnd(predicate);
        expect(predicate).toHaveBeenCalledWith("error");
      });
    });

    describe("ok", () => {
      it("should return None", () => {
        expect(new Err("error").ok()).toBeInstanceOf(None);
      });
    });

    describe("err", () => {
      it("should return Some(E)", () => {
        const opt = new Err("error").err();
        expect(opt).toBeInstanceOf(Some);
        expect(opt.inner()).toEqual("error");
      });
    });

    describe("map", () => {
      it("should return self", () => {
        const err = new Err("error");
        expect(err.map(() => {})).toBe(err);
      });
      it("should not execute the provided mapper", () => {
        const mapper = vi.fn();
        new Err("error").map(mapper);
        expect(mapper).not.toHaveBeenCalled();
      });
    });

    describe("mapOr", () => {
      it("should return the provided default value", () => {
        expect(new Err("error").mapOr("default", () => "")).toEqual("default");
      });
      it("should not execute the provided mapper", () => {
        const mapper = vi.fn();
        new Err("error").mapOr("default", mapper);
        expect(mapper).not.toHaveBeenCalled();
      });
    });

    describe("mapOrElse", () => {
      it("should return the computed default value", () => {
        expect(
          new Err("oopsie").mapOrElse(
            e => e + " daisy",
            () => "",
          ),
        ).toEqual("oopsie daisy");
      });
      it("should not execute the provided mapper", () => {
        const mapper = vi.fn();
        new Err("error").mapOrElse(() => "default", mapper);
        expect(mapper).not.toHaveBeenCalled();
      });
    });

    describe("mapErr", () => {
      it("should return a result containing the mapped inner value", () => {
        const res = new Err("oopsie").mapErr(e => e + " daisy");
        expect(res).toBeInstanceOf(Err);
        expect(res.inner()).toEqual("oopsie daisy");
      });
    });

    describe("inspect", () => {
      it("should return self", () => {
        const err = new Err("error");
        expect(err.inspect(() => {})).toBe(err);
      });
      it("should not call the inspect callback", () => {
        const inspector = vi.fn();
        new Err("error").inspect(inspector);
        expect(inspector).not.toHaveBeenCalled();
      });
    });

    describe("inspectErr", () => {
      it("should return self", () => {
        const err = new Err("error");
        expect(err.inspectErr(() => {})).toBe(err);
      });
      it("should call the inspect callback with the contained value", () => {
        const inspect = vi.fn();
        new Err("error").inspectErr(inspect);
        expect(inspect).toHaveBeenCalledWith("error");
      });
    });

    describe("expect", () => {
      it("show throw an ExpectationFailed with the custom message", () => {
        const err = new Err("error");
        const e: ExpectationFailed = captureThrown(() => err.expect("custom message"));
        expect(e).toBeInstanceOf(ExpectationFailed);
        expect(e.underlyingValue).toBe(err);
        expect(e.message).toEqual(
          "custom message: expected result to be an 'Ok' but is an 'Err' value: error",
        );
      });
    });

    describe("unwrap", () => {
      it("should throw a Panic", () => {
        const e: Panic = captureThrown(() => new Err("error").unwrap());
        expect(e).toBeInstanceOf(Panic);
        expect(e.message).toEqual("Called 'Result.unwrap()' on an 'Err' value: error");
      });
    });

    describe("expectErr", () => {
      it("should return the contained value", () => {
        expect(new Err("error").expectErr("")).toEqual("error");
      });
      it("should not throw", () => {
        expect(() => new Err("error").expectErr("")).not.toThrow();
      });
    });

    describe("unwrapErr", () => {
      it("should return the contained value", () => {
        expect(new Err("error").unwrapErr()).toEqual("error");
      });
      it("should not throw", () => {
        expect(() => new Err("error").unwrapErr()).not.toThrow();
      });
    });

    describe("intoOk", () => {
      it("should throw a Panic", () => {
        const e: Panic = captureThrown(() =>
          // @ts-expect-error - this should be a compile error but we're forcing calling it
          new Err("error").intoOk(),
        );
        expect(e).toBeInstanceOf(Panic);
        expect(e.message).toEqual(
          "Called 'Result.intoOk()' on an 'Err'. This should never occur and indicates a violation of the method receiver's type constraints.",
        );
      });
    });

    describe("intoErr", () => {
      it("should should return the contained failure value", () => {
        expect(new Err<never, string>("error").intoErr()).toEqual("error");
      });
    });

    describe("and", () => {
      it.each([new Ok<string, string>("other"), new Err<string, string>("other")])(
        "should return self",
        other => {
          const err = new Err("error");
          expect(err.and(other)).toBe(err);
        },
      );
    });

    describe("andThen", () => {
      it.each([new Ok("other"), new Err("other")])("should return self", other => {
        const err = new Err("error");
        expect(err.andThen(() => other)).toBe(err);
      });
      it("should not execute the then callback", () => {
        const then = vi.fn();
        new Err("error").andThen(then);
        expect(then).not.toHaveBeenCalled();
      });
    });

    describe("or", () => {
      it.each([new Ok("other"), new Err("other")])(
        "should return the other result",
        other => {
          expect(new Err("error").or(other)).toBe(other);
        },
      );
    });

    describe("orElse", () => {
      it.each([new Ok("other"), new Err("other")])(
        "should return the other result",
        other => {
          expect(new Err("error").orElse(() => other)).toBe(other);
        },
      );
      it("should call the else callback with the contained value", () => {
        const or = vi.fn();
        new Err("error").orElse(or);
        expect(or).toHaveBeenCalledWith("error");
      });
    });

    describe("unwrapOr", () => {
      it("should return the default value", () => {
        expect(new Err("error").unwrapOr("default")).toEqual("default");
      });
    });

    describe("unwrapOrElse", () => {
      it("should return the computed default value", () => {
        expect(new Err("oopsie").unwrapOrElse(e => e + " daisy")).toEqual("oopsie daisy");
      });
    });

    describe("match", () => {
      it("should return the result of the err branch", () => {
        expect(
          new Err("oopsie").match(
            () => "",
            e => e + " daisy",
          ),
        ).toEqual("oopsie daisy");
      });
      it("should not execute the ok branch", () => {
        const ok = vi.fn();
        new Err("error").match(ok, () => {});
        expect(ok).not.toHaveBeenCalled();
      });
    });

    describe("transpose", () => {
      it("should return Some(self)", () => {
        const err = new Err<Option<unknown>, string>("error");
        const opt = err.transpose();
        expect(opt).toBeInstanceOf(Some);
        expect(opt.inner()).toBe(err);
      });
    });

    describe("flatten", () => {
      it("should return self", () => {
        const err = new Err<Result<unknown, string>, string>("error");
        expect(err.flatten()).toBe(err);
      });
    });

    describe("toString", () => {
      it("should return a string representation of Err(E)", () => {
        expect(new Err("error").toString()).toEqual("Err(error)");
      });
    });

    describe("toJSON", () => {
      it("should serialize the Err", () => {
        expect(new Err("error").toJSON()).toEqual({
          ResultVariant: "Err",
          inner: "error",
        });
      });
    });

    describe("inspect symbol", () => {
      it("should delegate to toString", () => {
        const err = new Err("error");
        expect(err[inspectSymbol]()).toEqual(err.toString());
      });
    });
  });
});
