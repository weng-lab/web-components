import { describe, expect, it } from "vitest";
import { getCoordinates } from "./utils";

/** The region `getCoordinates` suggests for an input, or null if it suggests none. */
function domainOf(input: string, assembly = "GRCh38") {
  const results = getCoordinates(input, assembly);
  return results.length ? results[0].domain : null;
}

describe("getCoordinates", () => {
  it.each([
    ["chr1:100-200", { chromosome: "chr1", start: 100, end: 200 }],
    ["chr1:1,000-2,000", { chromosome: "chr1", start: 1000, end: 2000 }],
    ["chr1: 100 - 200", { chromosome: "chr1", start: 100, end: 200 }],
    ["chr1\t100\t200", { chromosome: "chr1", start: 100, end: 200 }],
    ["chr1\t100\t200\tpeak1", { chromosome: "chr1", start: 100, end: 200 }],
    ["chrx:100-200", { chromosome: "chrX", start: 100, end: 200 }],
  ])("accepts %j", (input, domain) => {
    expect(domainOf(input)).toEqual(domain);
  });

  it.each([
    ["chr1:100-", { chromosome: "chr1", start: 100, end: 1100 }],
    ["chr1:-", { chromosome: "chr1", start: 0, end: 1000 }],
    ["chr1:-200", { chromosome: "chr1", start: 0, end: 200 }],
  ])("suggests a region for the partly typed %j", (input, domain) => {
    expect(domainOf(input)).toEqual(domain);
  });

  it.each([
    // #164: parseInt reads a "0x" prefix as hexadecimal
    "chr1:0xA1B2-0xF4C3",
    "chr1:0XA1B2-0XF4C3",
    "chr1\t0xA1B2\t0xF4C3",
    "chr1:100abc-200xyz",
    "chr1:1e5-2e5",
    "chr1:1.5-200.9",
    "chr1:+100-+200",
    "chr1:abc-200",
    "chr1:100-abc",
    "chr1\tabc\t200",
  ])("rejects the non-decimal coordinates in %j", (input) => {
    expect(domainOf(input)).toBeNull();
  });

  it.each([
    "chr1:100-200-300",
    "chr1:-100-200",
    "chr1:100:200-300",
    "chr1\t100",
  ])("rejects the malformed range %j", (input) => {
    expect(domainOf(input)).toBeNull();
  });

  it.each([
    ["an end before the start", "chr1:200-100"],
    ["an empty range", "chr1:100-100"],
    ["an end past the chromosome", "chr1:100-248956423"],
    ["an unknown chromosome", "chr23:100-200"],
  ])("rejects %s", (_, input) => {
    expect(domainOf(input)).toBeNull();
  });

  it("checks the end against the assembly's chromosome length", () => {
    expect(domainOf("chr1:100-200000000", "GRCh38")).not.toBeNull();
    expect(domainOf("chr1:100-200000000", "mm10")).toBeNull();
  });
});
