import { describe, expect, it } from "vitest";
import {
  add,
  compare,
  divide,
  equalsRational,
  fromInt,
  isInteger,
  isNegative,
  isPositive,
  isZero,
  makeRational,
  multiply,
  negate,
  subtract,
  toDisplayString,
} from "@/domain/rational";

describe("rational", () => {
  it("reduces on construction", () => {
    expect(makeRational(2, 4)).toEqual({ numerator: 1, denominator: 2 });
    expect(makeRational(-2, 4)).toEqual({ numerator: -1, denominator: 2 });
    expect(makeRational(2, -4)).toEqual({ numerator: -1, denominator: 2 });
    expect(makeRational(-2, -4)).toEqual({ numerator: 1, denominator: 2 });
  });

  it("normalises zero to 0/1", () => {
    expect(makeRational(0, 5)).toEqual({ numerator: 0, denominator: 1 });
  });

  it("rejects a zero denominator", () => {
    expect(() => makeRational(1, 0)).toThrow();
  });

  it("adds exactly", () => {
    expect(add(makeRational(1, 3), makeRational(1, 6))).toEqual(makeRational(1, 2));
  });

  it("subtracts exactly", () => {
    expect(subtract(fromInt(10), fromInt(6))).toEqual(fromInt(4));
    expect(subtract(fromInt(-6), fromInt(-6))).toEqual(fromInt(0));
  });

  it("multiplies exactly", () => {
    expect(multiply(makeRational(2, 3), makeRational(3, 4))).toEqual(makeRational(1, 2));
  });

  it("divides exactly and rejects division by zero", () => {
    expect(divide(fromInt(16), fromInt(4))).toEqual(fromInt(4));
    expect(divide(fromInt(7), fromInt(2))).toEqual(makeRational(7, 2));
    expect(() => divide(fromInt(1), fromInt(0))).toThrow();
  });

  it("negates and takes sign", () => {
    expect(negate(fromInt(4))).toEqual(fromInt(-4));
    expect(isPositive(fromInt(4))).toBe(true);
    expect(isNegative(fromInt(-4))).toBe(true);
    expect(isZero(fromInt(0))).toBe(true);
  });

  it("reports integer-ness", () => {
    expect(isInteger(fromInt(4))).toBe(true);
    expect(isInteger(makeRational(7, 2))).toBe(false);
  });

  it("compares", () => {
    expect(compare(fromInt(1), fromInt(2))).toBe(-1);
    expect(compare(fromInt(2), fromInt(1))).toBe(1);
    expect(compare(makeRational(1, 2), makeRational(2, 4))).toBe(0);
  });

  it("checks equality structurally on reduced form", () => {
    expect(equalsRational(makeRational(2, 4), makeRational(1, 2))).toBe(true);
  });

  it("formats for display", () => {
    expect(toDisplayString(fromInt(4))).toBe("4");
    expect(toDisplayString(fromInt(-4))).toBe("-4");
    expect(toDisplayString(makeRational(7, 2))).toBe("7/2");
  });
});
