// lib.test.ts
import { describe, test, expect /*, beforeEach*/ } from "bun:test";
import {
  value,
  error,
  init,
  loading,
  match,
  first,
  last,
  previous,
  pctDiff,
  toAUD,
  toDecimalAU,
  toPercentAU,
  // toUnitAU,
  color,
  icon,
  // watchList,
  type AsyncResult,
  // type Result,
} from "./lib";

describe("Result Types & Factory Functions", () => {
  test("value() creates correct ValueResult", () => {
    const result = value(42);
    expect(result).toEqual({
      type: "value",
      value: 42,
      error: undefined,
    });
  });

  test("error() creates correct ErrorResult", () => {
    const err = new Error("boom");
    const result = error(err);
    expect(result).toEqual({
      type: "error",
      value: undefined,
      error: err,
    });
  });

  test("init() creates correct InitResult", () => {
    const result = init();
    expect(result).toEqual({
      type: "init",
      value: undefined,
      error: undefined,
    });
  });

  test("loading() creates correct LoadingResult", () => {
    const result = loading();
    expect(result).toEqual({
      type: "loading",
      value: undefined,
      error: undefined,
    });
  });
});

describe("match()", () => {
  const cases: Array<[AsyncResult<number>, string]> = [
    [init(), "init"],
    [loading(), "loading"],
    [value(100), "value:100"],
    [error(new Error("fail")), "error:fail"],
  ];

  test.each(cases)("match(%s) → %s", (input, expected) => {
    const result = match(input, {
      init: () => "init",
      loading: () => "loading",
      value: (v) => `value:${v}`,
      error: (e) => `error:${e.message}`,
    });
    expect(result).toBe(expected);
  });

  test("match throws on invalid type", () => {
    const invalid = { type: "invalid" } as any;
    expect(() =>
      match(invalid, {
        init: () => 0,
        loading: () => 0,
        value: () => 0,
        error: () => 0,
      }),
    ).toThrow("Unexpected");
  });
});

describe("Array Helpers", () => {
  const arr = [10, 20, 30, 40];

  test("first()", () => {
    expect(first(arr)).toBe(10);
    expect(first([])).toBeUndefined();
    expect(first(undefined)).toBeUndefined();
  });

  test("last()", () => {
    expect(last(arr)).toBe(40);
    expect(last([])).toBeUndefined();
    expect(last(undefined)).toBeUndefined();
  });

  test("previous()", () => {
    expect(previous(arr, 0)).toBe(40);
    expect(previous(arr, 1)).toBe(30);
    expect(previous(arr, 2)).toBe(20);
    expect(previous(arr, 3)).toBe(10);
    expect(previous(arr, 4)).toBeUndefined();
    expect(previous([], 0)).toBeUndefined();
  });
});

describe("pctDiff()", () => {
  test("calculates positive change", () => {
    expect(pctDiff(110, 100)).toBe(0.1);
  });

  test("calculates negative change", () => {
    expect(pctDiff(90, 100)).toBe(-0.1);
  });

  test("returns 0 when open is 0", () => {
    expect(pctDiff(50, 0)).toBe(0);
  });

  test("handles floating point", () => {
    expect(pctDiff(100.5, 100)).toBe(0.005);
  });
});

describe("Formatting Functions", () => {
  test("toAUD()", () => {
    expect(toAUD(1234.56)).toBe("$1,234.56");
    expect(toAUD(0)).toBe("$0.00");
    expect(toAUD(-500)).toBe("-$500.00");
  });

  test("toDecimalAU()", () => {
    expect(toDecimalAU(1234.56)).toBe("1,234.56");
    expect(toDecimalAU(1000)).toBe("1,000");
  });

  test("toPercentAU()", () => {
    expect(toPercentAU(0.1234)).toBe("12.34%");
    expect(toPercentAU(-0.05)).toBe("-5.00%");
    expect(toPercentAU(0)).toBe("0.00%");
  });
  /*
  test("toUnitAU()", () => {
    expect(toUnitAU(1000)).toBe("1,000");
    expect(toUnitAU(1.5)).toBe("1.5");
  });
  */
});

describe("color() and icon()", () => {
  test("color()", () => {
    expect(color(1)).toBe("#00da3c");
    expect(color(0)).toBe("#ecda3c");
    expect(color(-1)).toBe("#ec0000");
  });

  test("icon()", () => {
    expect(icon(1)).toBe("▲");
    expect(icon(0)).toBe("▶");
    expect(icon(-1)).toBe("▼");
  });
});
/*
describe("watchList", () => {
  test("has correct structure", () => {
    expect(watchList).toHaveLength(5);
    expect(watchList[0]).toEqual({
      commsec: "IOO",
      yahoo: "IOO.AX",
    });
    expect(watchList[1].yahoo).toBe("^AXJO"); // Index prefix
  });

  test("all yahoo symbols are valid", () => {
    watchList.forEach((item) => {
      expect(typeof item.yahoo).toBe("string");
      expect(item.yahoo.endsWith(".AX") || item.yahoo.startsWith("^")).toBe(true);
    });
  });
});
*/
