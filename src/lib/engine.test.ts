import { describe, expect, it } from "vitest";
import {
  analyzeParsedThesis,
  buildAnalogs,
  decideVerdict,
  paperTradesToCsv,
  summarizeEvidence,
} from "./engine";
import { fallbackParseThesis } from "./parser";
import type { EvidenceSummary } from "./types";

const input = {
  thesis: "NVDA beat earnings estimates and raised guidance, buy NVDA for 5 days.",
  asOfDate: "2026-06-25",
  startingBalance: 10_000,
  riskProfile: "balanced" as const,
};

describe("falsifiability engine", () => {
  it("produces an allow verdict and paper-trading row for a strong NVDA thesis", () => {
    const parsed = fallbackParseThesis(input);
    const result = analyzeParsedThesis(input, parsed);

    expect(result.verdict.verdict).toBe("ALLOW");
    expect(result.verdict.evidence.sampleSize).toBeGreaterThanOrEqual(8);
    expect(result.verdict.paperTrade).toMatchObject({
      asset: "NVDA",
      side: "LONG",
      verdict: "ALLOW",
    });
  });

  it("blocks SPCX because it is outside the cached asset universe", () => {
    const unsupportedInput = {
      thesis: "SPCX has strong momentum, buy SPCX for 5 days.",
      asOfDate: "2026-06-25",
      startingBalance: 10_000,
      riskProfile: "balanced" as const,
    };
    const parsed = fallbackParseThesis(unsupportedInput);
    const result = analyzeParsedThesis(unsupportedInput, parsed);

    expect(result.parsed.requestedTicker).toBe("SPCX");
    expect(result.verdict.verdict).toBe("BLOCK");
    expect(result.verdict.evidence.sampleSize).toBe(0);
    expect(result.verdict.paperTrade).toBeUndefined();
    expect(result.verdict.reason).toContain("SPCX is outside");
  });

  it("does not look ahead when creating analog entry dates", () => {
    const parsed = fallbackParseThesis(input);
    const analogs = buildAnalogs(input, parsed);

    expect(analogs.length).toBeGreaterThan(0);
    for (const analog of analogs) {
      expect(analog.entryDate > analog.eventDate).toBe(true);
      expect(analog.exitDate >= analog.entryDate).toBe(true);
    }
  });

  it("blocks thin evidence and reduces mixed evidence", () => {
    const thin: EvidenceSummary = {
      sampleSize: 3,
      medianReturnPct: 5,
      averageReturnPct: 5,
      hitRatePct: 100,
      costAdjustedEdgePct: 5,
      bestReturnPct: 7,
      worstReturnPct: 2,
    };
    const mixed: EvidenceSummary = {
      ...thin,
      sampleSize: 8,
      medianReturnPct: 0.1,
      averageReturnPct: 0.1,
      hitRatePct: 50,
      costAdjustedEdgePct: 0.1,
    };
    const parsed = fallbackParseThesis(input);

    expect(decideVerdict(parsed, thin)).toBe("BLOCK");
    expect(decideVerdict(parsed, mixed)).toBe("REDUCE_SIZE");
  });

  it("exports required paper log columns", () => {
    const parsed = fallbackParseThesis(input);
    const result = analyzeParsedThesis(input, parsed);
    const csv = paperTradesToCsv(result.verdict.paperTrade ? [result.verdict.paperTrade] : []);

    expect(csv).toContain("timestamp,asset,side,price,size,balance_before,balance_after,balance_change,verdict,reason");
    expect(csv).toContain("NVDA");
  });

  it("summarizes empty analogs without NaN", () => {
    const summary = summarizeEvidence([]);
    expect(summary.sampleSize).toBe(0);
    expect(summary.costAdjustedEdgePct).toBe(0);
  });
});
