import { describe, expect, it } from "vitest";
import { BaseQueryTransformer } from "./BaseQueryTransformer.js";

// Minimal concrete subclass for testing
class TestQueryTransformer extends BaseQueryTransformer<any> {
  transformFilter() {
    throw new Error("not implemented");
  }
  transformSort() {
    throw new Error("not implemented");
  }
  transformPagination() {
    throw new Error("not implemented");
  }
  // Expose protected methods for testing
  public _getNumberOrDurationMsFromValue(value: any) {
    return super.getNumberOrDurationMsFromValue(value);
  }
  public _getGtGteValue(value: any, date: Date) {
    return super.getGtGteValue(value, date);
  }
  public _getLtLteValue(value: any, date: Date) {
    return super.getLtLteValue(value, date);
  }
  public _getBetweenValue(value: [any, any], date: Date) {
    return super.getBetweenValue(value, date);
  }
}

describe("BaseQueryTransformer", () => {
  const transformer = new TestQueryTransformer();
  const baseDate = new Date("2024-01-01T00:00:00Z");

  describe("getNumberOrDurationMsFromValue", () => {
    it("returns valueNumber for numbers", () => {
      expect(transformer._getNumberOrDurationMsFromValue(42)).toEqual({
        valueNumber: 42,
        durationMs: undefined,
      });
    });
    it("parses duration strings (d, h, m, s)", () => {
      expect(transformer._getNumberOrDurationMsFromValue("2d")).toEqual({
        valueNumber: undefined,
        durationMs: 2 * 24 * 60 * 60 * 1000,
      });
      expect(transformer._getNumberOrDurationMsFromValue("3h")).toEqual({
        valueNumber: undefined,
        durationMs: 3 * 60 * 60 * 1000,
      });
      expect(transformer._getNumberOrDurationMsFromValue("15m")).toEqual({
        valueNumber: undefined,
        durationMs: 15 * 60 * 1000,
      });
      expect(transformer._getNumberOrDurationMsFromValue("10s")).toEqual({
        valueNumber: undefined,
        durationMs: 10 * 1000,
      });
    });
    it("parses ISO date strings", () => {
      const dateStr = "2024-01-01T12:00:00Z";
      expect(transformer._getNumberOrDurationMsFromValue(dateStr)).toEqual({
        valueNumber: new Date(dateStr).getTime(),
        durationMs: undefined,
      });
    });
    it("returns undefined for invalid strings", () => {
      expect(transformer._getNumberOrDurationMsFromValue("notadate")).toEqual({
        valueNumber: undefined,
        durationMs: undefined,
      });
    });
    it("returns undefined for other types", () => {
      expect(transformer._getNumberOrDurationMsFromValue({})).toEqual({
        valueNumber: undefined,
        durationMs: undefined,
      });
      expect(transformer._getNumberOrDurationMsFromValue(null)).toEqual({
        valueNumber: undefined,
        durationMs: undefined,
      });
    });
  });

  describe("getGtGteValue", () => {
    it("returns the number if value is a number", () => {
      expect(transformer._getGtGteValue(100, baseDate)).toBe(100);
    });
    it("returns date + durationMs for duration string", () => {
      expect(transformer._getGtGteValue("1d", baseDate)).toBe(
        baseDate.getTime() + 24 * 60 * 60 * 1000
      );
    });
    it("returns valueNumber for ISO date string", () => {
      const dateStr = "2024-01-02T00:00:00Z";
      expect(transformer._getGtGteValue(dateStr, baseDate)).toBe(
        new Date(dateStr).getTime()
      );
    });
    it("returns undefined for invalid input", () => {
      expect(transformer._getGtGteValue("invalid", baseDate)).toBeUndefined();
    });
  });

  describe("getLtLteValue", () => {
    it("returns the number if value is a number", () => {
      expect(transformer._getLtLteValue(100, baseDate)).toBe(100);
    });
    it("returns date - durationMs for duration string", () => {
      expect(transformer._getLtLteValue("1d", baseDate)).toBe(
        baseDate.getTime() - 24 * 60 * 60 * 1000
      );
    });
    it("returns valueNumber for ISO date string", () => {
      const dateStr = "2023-12-31T00:00:00Z";
      expect(transformer._getLtLteValue(dateStr, baseDate)).toBe(
        new Date(dateStr).getTime()
      );
    });
    it("returns undefined for invalid input", () => {
      expect(transformer._getLtLteValue("invalid", baseDate)).toBeUndefined();
    });
  });

  describe("getBetweenValue", () => {
    it("returns [min, max] for valid inputs", () => {
      expect(transformer._getBetweenValue([100, 200], baseDate)).toEqual([
        100, 200,
      ]);
    });
    it("handles duration strings for min and max", () => {
      expect(transformer._getBetweenValue(["1d", "2d"], baseDate)).toEqual([
        baseDate.getTime() + 24 * 60 * 60 * 1000,
        baseDate.getTime() - 2 * 24 * 60 * 60 * 1000,
      ]);
    });
    it("returns undefined if either value is invalid", () => {
      expect(
        transformer._getBetweenValue(["invalid", 200], baseDate)
      ).toBeUndefined();
      expect(
        transformer._getBetweenValue([100, "invalid"], baseDate)
      ).toBeUndefined();
    });
  });
});
