import { describe, expect, it } from "vitest";
import { ExpectationFailed, panic, Panic, recoverPanic } from "../src/panic";
import { captureThrown } from "./utils";

describe("Panic", () => {
  describe("constructor", () => {
    it("should set Error's message", () => {
      expect(new Panic("panic message").message).toEqual("panic message");
    });
    it("should set the Error's name", () => {
      expect(new Panic("").name).toEqual("Panic");
    });
  });
});

describe("ExpectationFailed", () => {
  it("should set Error's message", () => {
    expect(new ExpectationFailed("expectation not met").message).toEqual(
      "expectation not met",
    );
  });
  it("should set Error's name", () => {
    expect(new ExpectationFailed("").name).toEqual("ExpectationFailed");
  });
  it("should set the underlying value", () => {
    const value = {};
    expect(new ExpectationFailed("", value).underlyingValue).toBe(value);
  });
});

describe("panic", () => {
  it("should throw a Panic with the provided message", () => {
    const e: Panic = captureThrown(() => panic("panic message"));
    expect(e).toBeInstanceOf(Panic);
    expect(e.message).toEqual("panic message");
  });
});

describe("recoverPanic", () => {
  it("should catch Panics and return Some", () => {
    const p = new Panic("panic!");
    expect(
      recoverPanic(() => {
        throw p;
      }).unwrap(),
    ).toBe(p);
  });
  it("should should return None if the function does not throw", () => {
    expect(recoverPanic(() => {}).isNone()).toBe(true);
  });
  it("should re-throw non Panic errors", () => {
    expect(() =>
      recoverPanic(() => {
        throw new Error("");
      }),
    ).toThrow();
  });
});
