import crab, { Err, None, Ok, Result, ResultAsync, Some } from "../src/index";
import { crab as ogCrab } from "../src/crab";
import { describe, expect, it } from "vitest";

describe("index", () => {
  it("should export None and Some", () => {
    expect(Some).toBeDefined();
    expect(None).toBeDefined();
  });
  it("should export Ok and Err", () => {
    expect(Ok).toBeDefined();
    expect(Err).toBeDefined();
  });
  it("should export ResultAsync", () => {
    expect(ResultAsync).toBeDefined();
  });
  it("should export Result and Option types", () => {
    const res: Result<unknown, unknown> = new Ok("");
    void res;
  });
  it("should export the crab utility object", () => {
    expect(crab).toStrictEqual(ogCrab);
  });
});
