import { describe, expect, it } from "vitest";
import { fallbackParseThesis, parseQwenContent } from "./parser";

const baseInput = {
  thesis: "NVDA beat earnings estimates and raised guidance, buy NVDA for 5 days.",
  asOfDate: "2026-06-25",
};

describe("thesis parser", () => {
  it("extracts an earnings thesis with the offline fallback", () => {
    const parsed = fallbackParseThesis(baseInput);

    expect(parsed).toMatchObject({
      ticker: "NVDA",
      eventType: "earnings_surprise",
      direction: "LONG",
      horizonDays: 5,
      parser: "offline-fallback",
    });
  });

  it("normalizes strict JSON returned by Qwen", () => {
    const parsed = parseQwenContent(
      JSON.stringify({
        ticker: "QQQ",
        eventType: "fed_signal",
        direction: "LONG",
        horizonDays: 5,
        claim: "Fed sounded dovish; buy QQQ.",
        confidence: 0.88,
      }),
      { thesis: "Fed sounded dovish, buy QQQ for 5 days.", asOfDate: "2026-06-25" },
    );

    expect(parsed).toMatchObject({
      ticker: "QQQ",
      eventType: "fed_signal",
      direction: "LONG",
      horizonDays: 5,
      parser: "bitget-qwen",
    });
    expect(parsed.confidence).toBeCloseTo(0.88);
  });

  it("handles fenced JSON without accepting unsupported tickers", () => {
    const parsed = parseQwenContent(
      "```json\n{\"ticker\":\"GME\",\"eventType\":\"earnings_surprise\",\"direction\":\"LONG\",\"horizonDays\":20,\"claim\":\"unsupported\",\"confidence\":0.4}\n```",
      baseInput,
    );

    expect(parsed.ticker).toBe("NVDA");
    expect(parsed.horizonDays).toBe(20);
  });
});
