import { describe, expect, it } from "vitest";
import { constantTerm, xTerm } from "@/domain/equation";
import { formatEquation, plainTextEquation } from "@/domain/formatter";
import { fromInt, makeRational } from "@/domain/rational";

describe("formatter", () => {
  it("renders 2x - 6 = 10 with a natural minus, not '+ -'", () => {
    const equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    expect(plainTextEquation(equation)).toBe("2x - 6 = 10");
  });

  it("renders coefficient 1 as bare x", () => {
    const equation = { left: [xTerm(fromInt(1))], right: [constantTerm(fromInt(8))] };
    expect(plainTextEquation(equation)).toBe("x = 8");
  });

  it("renders coefficient -1 as leading -x", () => {
    const equation = { left: [xTerm(fromInt(-1))], right: [constantTerm(fromInt(8))] };
    expect(plainTextEquation(equation)).toBe("-x = 8");
  });

  it("never shows a denominator of 1", () => {
    const equation = { left: [constantTerm(fromInt(4))], right: [constantTerm(fromInt(4))] };
    const tree = formatEquation(equation);
    expect(tree.left[0].text).toBe("4");
  });

  it("renders a reduced fraction", () => {
    const equation = { left: [xTerm(fromInt(1))], right: [constantTerm(makeRational(7, 2))] };
    expect(plainTextEquation(equation)).toBe("x = 7/2");
    const tree = formatEquation(equation);
    expect(tree.right[0].magnitude).toEqual({ kind: "fraction", numerator: 7, denominator: 2 });
  });

  it("renders 24 - 4x = 8", () => {
    const equation = { left: [constantTerm(fromInt(24)), xTerm(fromInt(-4))], right: [constantTerm(fromInt(8))] };
    expect(plainTextEquation(equation)).toBe("24 - 4x = 8");
  });

  it("produces spoken text without a technical minus glyph", () => {
    const equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    const tree = formatEquation(equation);
    expect(tree.left[1].spokenText).toBe("negative 6");
  });
});
