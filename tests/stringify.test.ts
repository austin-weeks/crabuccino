import { describe, expect, it, vi } from "vitest";
import { stringify } from "../src/stringify";

describe("stringify", () => {
  describe("conversion", () => {
    it("null", () => {
      expect(stringify(null)).toEqual("null");
    });
    it("undefined", () => {
      expect(stringify(undefined)).toEqual("undefined");
    });
    it.each(["foo", "bar", "baz"])("string", str => {
      expect(stringify(str)).toEqual(str);
    });
    it.each([
      [0, "0"],
      [5, "5"],
      [27, "27"],
      [1.24, "1.24"],
    ])("number", (num, numStr) => {
      expect(stringify(num)).toEqual(numStr);
    });
    it("object", () => {
      expect(stringify({ foo: "bar" })).toEqual('{"foo":"bar"}');
    });
    it("function", () => {
      expect(stringify((v: string) => v)).toEqual("(v) => v");
    });
    it("symbol", () => {
      expect(stringify(Symbol("yarg"))).toEqual("Symbol(yarg)");
    });
  });

  describe("truncation", () => {
    it("should truncate very long strings", () => {
      expect(
        stringify("looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong"),
      ).toEqual("looooooooooooooooooooooooooooooooooo");
    });
    it("should preserve long strings when truncate=false", () => {
      const str = "looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong";
      expect(stringify(str, false)).toEqual(str);
    });
  });

  it("should fallback to String() if JSON.parse() throws", () => {
    vi.spyOn(JSON, "stringify").mockImplementation(() => {
      throw new Error("oops!");
    });
    expect(stringify({ foo: "bar" })).toEqual("[object Object]");
  });
});
