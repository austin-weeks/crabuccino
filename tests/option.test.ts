import { describe, expect, it, vi } from "vitest";
import {
  None,
  Some,
  Option,
  fromNullish,
  some,
  none,
  inspectSymbol,
} from "../src/option";
import { Err, Ok, Result } from "../src/result";
import { ExpectationFailed, Panic } from "../src/panic";
import { captureThrown } from "./utils";

// TODO: add typing tests

describe("Option", () => {
  describe("top-level functions", () => {
    describe("fromNullish", () => {
      it("should return None when given null", () => {
        expect(fromNullish(null)).toBeInstanceOf(None);
      });
      it("should return None when given undefined", () => {
        expect(fromNullish(undefined)).toBeInstanceOf(None);
      });
      it("should return Some(T) when given a non-nullish value", () => {
        const some = fromNullish("value");
        expect(some).toBeInstanceOf(Some);
        expect(some.unwrap()).toEqual("value");
      });
    });

    describe("some", () => {
      it("should construct a Some(T)", () => {
        const v = some("value");
        expect(v).toBeInstanceOf(Some);
        expect(v.unwrap()).toEqual("value");
      });
    });
    describe("none", () => {
      it("should construct a None", () => {
        expect(none()).toBeInstanceOf(None);
      });
    });
  });

  describe("Some", () => {
    describe("toNullish", () => {
      it("should return the value", () => {
        const some = new Some("val");
        expect(some.toNullish()).toEqual("val");
      });
    });

    describe("inner", () => {
      it("should return the contained value", () => {
        expect(new Some("val").inner()).toEqual("val");
      });
    });

    describe("match", () => {
      it("should call the some callback with the contained value and return the result", () => {
        expect(
          new Some(5).match(
            v => v * 2,
            () => {},
          ),
        ).toEqual(10);
      });
      it("should not execute the none callback", () => {
        const cb = vi.fn();
        new Some("").match(() => {}, cb);
        expect(cb).not.toHaveBeenCalled();
      });
    });

    describe("isSome", () => {
      it("should be true", () => {
        const some = new Some("val");
        expect(some.isSome()).toBe(true);
        expect(some.inner()).toEqual("val");
      });
    });

    describe("isSomeAnd", () => {
      it("should return true if the predicate returns true", () => {
        expect(new Some("").isSomeAnd(() => true)).toBe(true);
      });
      it("should return false if the predicate returns false", () => {
        expect(new Some("").isSomeAnd(() => false)).toBe(false);
      });
      it("should call the predicate with the contained value", () => {
        const callback = vi.fn(() => true);
        new Some("val").isSomeAnd(callback);
        expect(callback).toHaveBeenCalledWith("val");
      });
    });

    describe("isNone", () => {
      it("should return false", () => {
        expect(new Some("").isNone()).toBe(false);
      });
    });

    describe("isNoneOr", () => {
      it("should return true if the predicate returns true", () => {
        expect(new Some("").isNoneOr(() => true)).toBe(true);
      });
      it("should return false if the predicate returns false", () => {
        expect(new Some("").isNoneOr(() => false)).toBe(false);
      });
      it("should call the predicate with the contained value", () => {
        const predicate = vi.fn(() => true);
        new Some("val").isNoneOr(predicate);
        expect(predicate).toHaveBeenCalledWith("val");
      });
    });

    describe("expect", () => {
      it("should return the contained value", () => {
        expect(new Some("val").expect("")).toEqual("val");
      });
      it("should not throw", () => {
        expect(() => new Some("").expect("")).not.toThrow();
      });
    });

    describe("unwrap", () => {
      it("should return the contained value", () => {
        expect(new Some("val").unwrap()).toEqual("val");
      });
      it("should not throw", () => {
        expect(() => new Some("").unwrap()).not.toThrow();
      });
    });

    describe("unwrapOr", () => {
      it("should return the contained value", () => {
        expect(new Some("val").unwrapOr("fallback")).toEqual("val");
      });
    });

    describe("unwrapOrElse", () => {
      it("should return the contained value", () => {
        expect(new Some("val").unwrapOrElse(() => "fallback")).toEqual("val");
      });
      it("should not execute the fallback function", () => {
        const fallback = vi.fn();
        new Some("val").unwrapOrElse(fallback);
        expect(fallback).not.toHaveBeenCalled();
      });
    });

    describe("map", () => {
      it("should map the contained value", () => {
        const mapped = new Some("hello").map(v => v + " world");
        expect(mapped).toBeInstanceOf(Some);
        expect(mapped.inner()).toEqual("hello world");
      });
    });

    describe("inspect", () => {
      it("should call the provided function with the contained value", () => {
        const callback = vi.fn();
        new Some("val").inspect(callback);
        expect(callback).toHaveBeenCalledWith("val");
      });
      it("should return self", () => {
        const some = new Some("val");
        expect(some.inspect(() => {})).toBe(some);
      });
    });

    describe("mapOr", () => {
      it("should map the contained value", () => {
        const mapped = new Some("hello").mapOr("default", v => v + " world");
        expect(mapped).toEqual("hello world");
      });
    });

    describe("mapOrElse", () => {
      it("should map the contained value", () => {
        const mapped = new Some("hello").mapOrElse(
          () => "default",
          v => v + " world",
        );
        expect(mapped).toEqual("hello world");
      });
      it("should not execute the default function", () => {
        const def = vi.fn();
        new Some("").mapOrElse(def, () => "");
        expect(def).not.toHaveBeenCalled();
      });
    });

    describe("okOr", () => {
      it("should return Ok(T)", () => {
        const ok = new Some("val").okOr(new Error());
        expect(ok).toBeInstanceOf(Ok);
        expect(ok.inner()).toEqual("val");
      });
    });

    describe("okOrElse", () => {
      it("should return Ok(T)", () => {
        const ok = new Some("val").okOrElse(() => new Error());
        expect(ok).toBeInstanceOf(Ok);
        expect(ok.inner()).toEqual("val");
      });
      it("should not call the err function", () => {
        const err = vi.fn();
        new Some("val").okOrElse(err);
        expect(err).not.toHaveBeenCalled();
      });
    });

    describe("and", () => {
      it.each([new Some("other"), new None()])("should return optb", optb => {
        expect(new Some("").and(optb)).toBe(optb);
      });
    });

    describe("andThen", () => {
      it("should return the callback's result", () => {
        const andThenned = new Some("hello").andThen(v => new Some(v + " world"));
        expect(andThenned.unwrap()).toEqual("hello world");
      });
    });

    describe("filter", () => {
      it("should return self if predicate returns true", () => {
        const some = new Some("val");
        expect(some.filter(() => true)).toBe(some);
      });
      it("should return None if predicate returns false", () => {
        expect(new Some("val").filter(() => false)).toBeInstanceOf(None);
      });
      it("should call the predicate with the contained value", () => {
        const callback = vi.fn(() => true);
        new Some("val").filter(callback);
        expect(callback).toHaveBeenCalledWith("val");
      });
    });

    describe("or", () => {
      it.each([new Some("other"), new None<string>()])("should return self", optb => {
        const some = new Some("val");
        expect(some.or(optb)).toBe(some);
      });
    });

    describe("orElse", () => {
      it.each([new Some("other"), new None<string>()])("should return self", optb => {
        const some = new Some("val");
        expect(some.orElse(() => optb)).toBe(some);
      });
      it("should not call the provided function", () => {
        const callback = vi.fn();
        new Some("val").orElse(callback);
        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe("xor", () => {
      it("should return self if optb is None", () => {
        const some = new Some("val");
        expect(some.xor(new None())).toBe(some);
      });
      it("should return None if optb is Some", () => {
        expect(new Some("val").xor(new Some(""))).toBeInstanceOf(None);
      });
    });

    describe("zip", () => {
      it("should return Some([a, b]) if other is Some", () => {
        expect(new Some("a").zip(new Some("b")).unwrap()).toEqual(["a", "b"]);
      });
      it("should return None if other is None", () => {
        expect(new Some("").zip(new None())).toBeInstanceOf(None);
      });
    });

    describe("unzip", () => {
      it("should return [Option(A), Option(B)]", () => {
        const [a, b] = new Some<[string, string]>(["a", "b"]).unzip();
        expect(a.inner()).toEqual("a");
        expect(b.inner()).toEqual("b");
      });
    });

    describe("transpose", () => {
      it("should return Ok(Some(T)) if the contained value is Ok", () => {
        const res = new Some(new Ok("okay")).transpose();
        expect(res).toBeInstanceOf(Ok);
        expect(res.unwrap()).toBeInstanceOf(Some);
        expect(res.unwrap().unwrap()).toEqual("okay");
      });
      it("should return Err(E) if the contained value is Err", () => {
        const res = new Some(new Err("error")).transpose();
        expect(res).toBeInstanceOf(Err);
        expect(res.unwrapErr()).toEqual("error");
      });
    });

    describe("flatten", () => {
      it("should return the contained value", () => {
        const inner = new Some("val");
        expect(new Some(inner).flatten()).toBe(inner);
      });
    });

    describe("toString", () => {
      it("should return a string representation of Some(T)", () => {
        expect(new Some("value").toString()).toEqual("Some(value)");
      });
    });

    describe("toJSON", () => {
      it("should serialize the Some", () => {
        expect(new Some("value").toJSON()).toEqual({
          OptionVariant: "Some",
          inner: "value",
        });
      });
    });

    describe("inspect symbol", () => {
      it("should delegate to toString", () => {
        const some = new Some("value");
        expect(some[inspectSymbol]()).toEqual(some.toString());
      });
    });
  });

  describe("None", () => {
    describe("toNullish", () => {
      it("should return undefined", () => {
        expect(new None().toNullish()).toBeUndefined();
      });
    });

    describe("match", () => {
      it("should call the none callback and return the result", () => {
        expect(
          new None().match(
            () => {},
            () => "none",
          ),
        ).toEqual("none");
      });
      it("should not execute the some callback", () => {
        const cb = vi.fn();
        new None().match(cb, () => {});
        expect(cb).not.toHaveBeenCalled();
      });
    });

    describe("isSome", () => {
      it("should return false", () => {
        expect(new None().isSome()).toBe(false);
      });
    });

    describe("isSomeAnd", () => {
      it("should return false", () => {
        expect(new None().isSomeAnd(() => true)).toBe(false);
      });
      it("should not call the predicate", () => {
        const predicate = vi.fn();
        new None().isSomeAnd(predicate);
        expect(predicate).not.toHaveBeenCalled();
      });
    });

    describe("isNone", () => {
      it("should return true", () => {
        expect(new None().isNone()).toBe(true);
      });
    });

    describe("isNoneOr", () => {
      it("should return true", () => {
        expect(new None().isNoneOr(() => true)).toBe(true);
      });
      it("should not call the predicate", () => {
        const predicate = vi.fn();
        new None().isNoneOr(predicate);
        expect(predicate).not.toHaveBeenCalled();
      });
    });

    describe("expect", () => {
      it("should throw an ExpectationFailed with the custom message", () => {
        const none = new None();
        const e: ExpectationFailed = captureThrown(() => none.expect("custom message"));
        expect(e).toBeInstanceOf(ExpectationFailed);
        expect(e.underlyingValue).toBe(none);
        expect(e.message).toEqual("custom message: expected 'Some', got 'None'");
      });
    });

    describe("unwrap", () => {
      it("should throw a Panic", () => {
        const e: Panic = captureThrown(() => new None().unwrap());
        expect(e).toBeInstanceOf(Panic);
        expect(e.message).toEqual("Called 'Option.unwrap()' on a 'None' variant");
      });
    });

    describe("unwrapOr", () => {
      it("should return the default value", () => {
        expect(new None().unwrapOr("default")).toEqual("default");
      });
    });

    describe("unwrapOrElse", () => {
      it("should return the computed default", () => {
        expect(new None().unwrapOrElse(() => "default")).toEqual("default");
      });
    });

    describe("map", () => {
      it("should return self", () => {
        const none = new None();
        expect(none.map(() => {})).toBe(none);
      });
      it("should not execute the provided function", () => {
        const f = vi.fn();
        new None().map(f);
        expect(f).not.toHaveBeenCalled();
      });
    });

    describe("inspect", () => {
      it("should return self", () => {
        const none = new None();
        expect(none.inspect(() => {})).toBe(none);
      });
      it("should not execute the provided function", () => {
        const f = vi.fn();
        new None().inspect(f);
        expect(f).not.toHaveBeenCalled();
      });
    });

    describe("mapOr", () => {
      it("should return the default value", () => {
        expect(new None().mapOr("default", () => "")).toEqual("default");
      });
      it("should not call the mapping function", () => {
        const mapper = vi.fn();
        new None().mapOr("", mapper);
        expect(mapper).not.toHaveBeenCalled();
      });
    });

    describe("mapOrElse", () => {
      it("should return the computed default", () => {
        expect(
          new None().mapOrElse(
            () => "default",
            () => "",
          ),
        ).toEqual("default");
      });
      it("should not call the mapping function", () => {
        const mapper = vi.fn();
        new None().mapOrElse(() => {}, mapper);
        expect(mapper).not.toHaveBeenCalled();
      });
    });

    describe("okOr", () => {
      it("should return the fallback error", () => {
        const inner = new Error();
        const err = new None().okOr(inner);
        expect(err).toBeInstanceOf(Err);
        expect(err.inner()).toBe(inner);
      });
    });

    describe("okOrElse", () => {
      it("should return the computed fallback error", () => {
        const inner = new Error();
        const err = new None().okOrElse(() => inner);
        expect(err).toBeInstanceOf(Err);
        expect(err.inner()).toBe(inner);
      });
    });

    describe("and", () => {
      it.each([new Some("other"), new None()])("should return self", optb => {
        const none = new None();
        expect(none.and(optb)).toBe(none);
      });
    });

    describe("andThen", () => {
      it("should return self", () => {
        const none = new None();
        expect(none.andThen(() => new None())).toBe(none);
      });
      it("should not execute the provided function", () => {
        const f = vi.fn();
        new None().andThen(f);
        expect(f).not.toHaveBeenCalled();
      });
    });

    describe("filter", () => {
      it("should return self", () => {
        const none = new None();
        expect(none.filter(() => true)).toBe(none);
      });
      it("should not execute the predicate", () => {
        const predicate = vi.fn();
        new None().filter(predicate);
        expect(predicate).not.toHaveBeenCalled();
      });
    });

    describe("or", () => {
      it.each([new Some("val"), new None()])("should return optb", optb => {
        expect(new None().or(optb)).toBe(optb);
      });
    });

    describe("orElse", () => {
      it.each([new Some("val"), new None()])("should return the computed optb", optb => {
        expect(new None().orElse(() => optb)).toBe(optb);
      });
    });

    describe("xor", () => {
      it.each([new Some("val"), new None()])("should return optb", optb => {
        expect(new None().xor(optb)).toBe(optb);
      });
    });

    describe("zip", () => {
      it.each([new Some("other"), new None()])("should return self", other => {
        const none = new None();
        expect(none.zip(other)).toBe(none);
      });
    });

    describe("unzip", () => {
      it("should return [None, None]", () => {
        const [a, b] = new None<[string, string]>().unzip();
        expect(a).toBeInstanceOf(None);
        expect(b).toBeInstanceOf(None);
      });
    });

    describe("transpose", () => {
      it("should return Ok(None)", () => {
        const res = new None<Result<string, string>>().transpose();
        expect(res).toBeInstanceOf(Ok);
        expect(res.unwrap()).toBeInstanceOf(None);
      });
    });

    describe("flatten", () => {
      it("should return self", () => {
        const none = new None<Option<unknown>>();
        expect(none.flatten()).toBe(none);
      });
    });

    describe("toString", () => {
      it("should return a string representation of None", () => {
        expect(new None().toString()).toEqual("None");
      });
    });

    describe("toJSON", () => {
      it("should serialize the None", () => {
        expect(new None().toJSON()).toEqual({
          OptionVariant: "None",
        });
      });
    });

    describe("inspect symbol", () => {
      it("should delegate to toString", () => {
        const none = new None();
        expect(none[inspectSymbol]()).toEqual(none.toString());
      });
    });
  });
});
