import { describe, it, expect } from "vitest";

// Helper function to parse and calculate total
export function calculateTotal(amounts: string): number {
  const amountList = amounts
    .split(/[,\n]+/)
    .map((amt) => amt.trim())
    .filter((amt) => amt !== "");

  return amountList.reduce((sum, amt) => {
    const num = parseFloat(amt);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
}

describe("calculateTotal - Confidential", () => {
  it("sums numbers separated by commas", () => {
    expect(calculateTotal("1,2,3")).toBe(6);
  });

  it("sums numbers separated by newlines", () => {
    expect(calculateTotal("4\n5\n6")).toBe(15);
  });

  it("sums numbers separated by mixed commas and newlines", () => {
    expect(calculateTotal("1,2\n3,4\n5")).toBe(15);
  });

  it("ignores empty values", () => {
    expect(calculateTotal("1,,2\n\n3")).toBe(6);
  });

  it("handles invalid values by treating them as 0", () => {
    expect(calculateTotal("1,2,abc")).toBe(3); // Note: Different behavior - skips invalid
    expect(calculateTotal("1\nxyz\n3")).toBe(4);
  });

  it("trims spaces around numbers", () => {
    expect(calculateTotal(" 1 , 2 \n 3 ")).toBe(6);
  });

  it("returns 0 for empty string", () => {
    expect(calculateTotal("")).toBe(0);
  });

  it("handles decimal numbers", () => {
    expect(calculateTotal("1.5,2.25,3.75")).toBeCloseTo(7.5);
    expect(calculateTotal("0.1\n0.2\n0.3")).toBeCloseTo(0.6);
  });

  it("handles mixed integers and decimals", () => {
    expect(calculateTotal("1,2.5,3\n4.5")).toBeCloseTo(11);
  });

  it("handles large numbers", () => {
    expect(calculateTotal("1000,2000,3000")).toBe(6000);
  });

  it("handles very small decimal numbers", () => {
    expect(calculateTotal("0.001,0.002,0.003")).toBeCloseTo(0.006);
  });
});