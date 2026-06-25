import { mkdirSync, writeFileSync } from "node:fs";
import { analyzeParsedThesis, paperTradesToCsv } from "../src/lib/engine";
import { dataManifest } from "../src/lib/fixtures";
import { fallbackParseThesis } from "../src/lib/parser";
import type { AnalysisResult, ThesisInput } from "../src/lib/types";

const inputs: ThesisInput[] = [
  {
    thesis: "NVDA beat earnings estimates and raised guidance, buy NVDA for 5 days.",
    asOfDate: "2026-06-25",
    startingBalance: 10_000,
    riskProfile: "balanced",
  },
  {
    thesis: "TSLA missed earnings estimates, short TSLA for 1 day.",
    asOfDate: "2026-06-25",
    startingBalance: 10_000,
    riskProfile: "balanced",
  },
  {
    thesis: "Fed sounded dovish, buy QQQ for 5 days.",
    asOfDate: "2026-06-25",
    startingBalance: 10_000,
    riskProfile: "balanced",
  },
  {
    thesis: "SPCX is a top-performing momentum breakout, buy SPCX for 5 days.",
    asOfDate: "2026-06-25",
    startingBalance: 10_000,
    riskProfile: "balanced",
  },
  {
    thesis: "A vague rumor says ABCD may go up soon.",
    asOfDate: "2026-06-25",
    startingBalance: 10_000,
    riskProfile: "conservative",
  },
];

function main() {
  mkdirSync("runs", { recursive: true });
  const outputs = inputs.map((input) => analyzeParsedThesis(input, fallbackParseThesis(input)));
  const paperTrades = outputs.flatMap((output) =>
    output.verdict.paperTrade ? [output.verdict.paperTrade] : [],
  );
  const backtestReport = buildBacktestReport(outputs);

  writeJson("runs/sample-inputs.json", inputs);
  writeJson("runs/sample-outputs.json", outputs);
  writeFileSync("runs/paper_trading_log.csv", paperTradesToCsv(paperTrades));
  writeJson("runs/backtest_report.json", backtestReport);
  writeJson("runs/data_manifest.json", dataManifest);
}

function buildBacktestReport(outputs: AnalysisResult[]) {
  return {
    generatedAt: new Date().toISOString(),
    methodology:
      "Each sample thesis is parsed with the deterministic fallback, matched to cached historical analogs, and compared against a naive thesis-following agent on the same analog set.",
    samples: outputs.map((output) => ({
      thesis: output.input.thesis,
      ticker: output.parsed.ticker,
      eventType: output.parsed.eventType,
      direction: output.parsed.direction,
      verdict: output.verdict.verdict,
      evidence: output.verdict.evidence,
      naive: output.verdict.comparison.naive,
      thesisBench: output.verdict.comparison.thesisBench,
    })),
  };
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

main();
