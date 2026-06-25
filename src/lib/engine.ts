import { earningsEvents, fedEvents, priceHistory } from "./fixtures";
import type {
  AnalysisResult,
  BacktestComparison,
  EarningsEvent,
  EventAnalog,
  EventType,
  EvidenceSummary,
  FedEvent,
  PaperTrade,
  ParsedThesis,
  PriceBar,
  StrategyStats,
  SupportedTicker,
  ThesisInput,
  ThesisVerdict,
  TradeDirection,
  VerdictKind,
} from "./types";

const COST_PCT = 0.12;
const DEFAULT_BALANCE = 10_000;

export function analyzeParsedThesis(input: ThesisInput, parsed: ParsedThesis): AnalysisResult {
  const analogs = buildAnalogs(input, parsed);
  const evidence = summarizeEvidence(analogs);
  const verdictKind = decideVerdict(parsed, evidence);
  const positionSizePct = positionSizeForVerdict(verdictKind, input.riskProfile ?? "balanced", evidence);
  const reason = explainVerdict(verdictKind, parsed, evidence);
  const paperTrade = createPaperTrade(input, parsed, verdictKind, positionSizePct, reason);
  const comparison = compareStrategies(analogs, input.startingBalance ?? DEFAULT_BALANCE);

  return {
    input,
    parsed,
    generatedAt: new Date().toISOString(),
    verdict: {
      verdict: verdictKind,
      positionSizePct,
      reason,
      evidence,
      analogs: analogs.slice(0, 12),
      paperTrade,
      comparison,
    },
  };
}

export function buildAnalogs(input: ThesisInput, parsed: ParsedThesis): EventAnalog[] {
  if (parsed.direction === "HOLD") return [];
  if (parsed.eventType === "earnings_surprise") return buildEarningsAnalogs(input, parsed);
  return buildFedAnalogs(input, parsed);
}

function buildEarningsAnalogs(input: ThesisInput, parsed: ParsedThesis): EventAnalog[] {
  const asOf = input.asOfDate;
  const tickerEvents = earningsEvents.filter(
    (event) => event.ticker === parsed.ticker && event.date < asOf,
  );
  const directionallySimilar = tickerEvents.filter((event) =>
    parsed.direction === "LONG"
      ? event.surprisePct >= 0 || event.guidance === "raised"
      : event.surprisePct <= 0 || event.guidance === "lowered",
  );
  const selected = directionallySimilar.length >= 8 ? directionallySimilar : tickerEvents;

  return selected
    .map((event) => analogFromEarnings(event, parsed.direction as Exclude<TradeDirection, "HOLD">, parsed.horizonDays))
    .filter(isEventAnalog)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}

function buildFedAnalogs(input: ThesisInput, parsed: ParsedThesis): EventAnalog[] {
  const asOf = input.asOfDate;
  const targetTicker: SupportedTicker = parsed.ticker === "QQQ" ? "QQQ" : "SPY";
  const similar = fedEvents.filter((event) => {
    if (event.date >= asOf) return false;
    if (parsed.direction === "LONG") return event.stance === "dovish" || event.stance === "neutral";
    return event.stance === "hawkish" || event.stance === "neutral";
  });
  const selected = similar.length >= 8 ? similar : fedEvents.filter((event) => event.date < asOf);

  return selected
    .map((event) => analogFromFed(event, targetTicker, parsed.direction as Exclude<TradeDirection, "HOLD">, parsed.horizonDays))
    .filter(isEventAnalog)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}

function analogFromEarnings(
  event: EarningsEvent,
  direction: Exclude<TradeDirection, "HOLD">,
  horizonDays: 1 | 5 | 20,
): EventAnalog | null {
  const entry = nextBarAfter(event.ticker, event.date);
  const exit = barAfterTradingDays(event.ticker, entry?.date, horizonDays);
  if (!entry || !exit) return null;
  return buildAnalog({
    eventId: event.id,
    ticker: event.ticker,
    eventType: "earnings_surprise",
    eventDate: event.date,
    entry,
    exit,
    direction,
    descriptor: `${event.ticker} EPS surprise ${event.surprisePct}% / guidance ${event.guidance}`,
  });
}

function analogFromFed(
  event: FedEvent,
  ticker: SupportedTicker,
  direction: Exclude<TradeDirection, "HOLD">,
  horizonDays: 1 | 5 | 20,
): EventAnalog | null {
  const entry = nextBarAfter(ticker, event.date);
  const exit = barAfterTradingDays(ticker, entry?.date, horizonDays);
  if (!entry || !exit) return null;
  return buildAnalog({
    eventId: event.id,
    ticker,
    eventType: "fed_signal",
    eventDate: event.date,
    entry,
    exit,
    direction,
    descriptor: `Fed ${event.stance}, ${event.rateChangeBps} bps: ${event.summary}`,
  });
}

function isEventAnalog(value: EventAnalog | null): value is EventAnalog {
  return value !== null;
}

function buildAnalog(params: {
  eventId: string;
  ticker: SupportedTicker;
  eventType: EventType;
  eventDate: string;
  entry: PriceBar;
  exit: PriceBar;
  direction: Exclude<TradeDirection, "HOLD">;
  descriptor: string;
}): EventAnalog {
  const rawReturn =
    params.direction === "LONG"
      ? params.exit.close / params.entry.open - 1
      : params.entry.open / params.exit.close - 1;
  const rawReturnPct = round(rawReturn * 100, 2);
  const costAdjustedReturnPct = round(rawReturnPct - COST_PCT, 2);

  return {
    eventId: params.eventId,
    ticker: params.ticker,
    eventType: params.eventType,
    eventDate: params.eventDate,
    entryDate: params.entry.date,
    exitDate: params.exit.date,
    direction: params.direction,
    entryPrice: params.entry.open,
    exitPrice: params.exit.close,
    rawReturnPct,
    costAdjustedReturnPct,
    descriptor: params.descriptor,
  };
}

export function summarizeEvidence(analogs: EventAnalog[]): EvidenceSummary {
  const returns = analogs.map((analog) => analog.costAdjustedReturnPct).sort((a, b) => a - b);
  if (!returns.length) {
    return {
      sampleSize: 0,
      medianReturnPct: 0,
      averageReturnPct: 0,
      hitRatePct: 0,
      costAdjustedEdgePct: 0,
      bestReturnPct: 0,
      worstReturnPct: 0,
    };
  }

  return {
    sampleSize: returns.length,
    medianReturnPct: round(median(returns), 2),
    averageReturnPct: round(returns.reduce((sum, value) => sum + value, 0) / returns.length, 2),
    hitRatePct: round((returns.filter((value) => value > 0).length / returns.length) * 100, 1),
    costAdjustedEdgePct: round(median(returns), 2),
    bestReturnPct: round(Math.max(...returns), 2),
    worstReturnPct: round(Math.min(...returns), 2),
  };
}

export function decideVerdict(parsed: ParsedThesis, evidence: EvidenceSummary): VerdictKind {
  if (parsed.direction === "HOLD") return "BLOCK";
  if (evidence.sampleSize < 8) return "BLOCK";
  if (evidence.costAdjustedEdgePct > 0.35 && evidence.hitRatePct >= 52) return "ALLOW";
  if (evidence.costAdjustedEdgePct >= 0 && evidence.hitRatePct >= 45) return "REDUCE_SIZE";
  return "BLOCK";
}

function positionSizeForVerdict(
  verdict: VerdictKind,
  riskProfile: "conservative" | "balanced",
  evidence: EvidenceSummary,
): number {
  if (verdict === "BLOCK") return 0;
  const base = verdict === "ALLOW" ? 8 : 3;
  const riskScale = riskProfile === "conservative" ? 0.65 : 1;
  const evidenceScale = Math.min(1.25, Math.max(0.5, evidence.hitRatePct / 58));
  return round(base * riskScale * evidenceScale, 2);
}

function explainVerdict(
  verdict: VerdictKind,
  parsed: ParsedThesis,
  evidence: EvidenceSummary,
): string {
  if (parsed.direction === "HOLD") return "The thesis did not resolve to a directional paper trade.";
  if (evidence.sampleSize < 8) {
    return `Blocked because only ${evidence.sampleSize} historical analogs were available; minimum is 8.`;
  }
  if (verdict === "ALLOW") {
    return `Allowed because ${evidence.sampleSize} analogs show ${evidence.costAdjustedEdgePct}% median edge after costs with ${evidence.hitRatePct}% hit rate.`;
  }
  if (verdict === "REDUCE_SIZE") {
    return `Reduced because evidence is non-negative but not strong enough for full paper size: ${evidence.costAdjustedEdgePct}% median edge and ${evidence.hitRatePct}% hit rate.`;
  }
  return `Blocked because analog evidence is weak after costs: ${evidence.costAdjustedEdgePct}% median edge and ${evidence.hitRatePct}% hit rate.`;
}

function createPaperTrade(
  input: ThesisInput,
  parsed: ParsedThesis,
  verdict: VerdictKind,
  positionSizePct: number,
  reason: string,
): PaperTrade | undefined {
  const latest = latestBarAtOrBefore(parsed.ticker, input.asOfDate);
  if (!latest || parsed.direction === "HOLD") return undefined;
  const balanceBefore = input.startingBalance ?? DEFAULT_BALANCE;
  const notional = balanceBefore * (positionSizePct / 100);
  const size = latest.close > 0 ? notional / latest.close : 0;
  const fee = notional * (COST_PCT / 100);
  const balanceChange = verdict === "BLOCK" ? 0 : -fee;

  return {
    timestamp: `${input.asOfDate}T20:05:00.000Z`,
    asset: parsed.ticker,
    side: verdict === "BLOCK" ? "HOLD" : parsed.direction,
    price: latest.close,
    size: round(size, 4),
    balanceBefore: round(balanceBefore, 2),
    balanceAfter: round(balanceBefore + balanceChange, 2),
    balanceChange: round(balanceChange, 2),
    verdict,
    reason,
  };
}

function compareStrategies(analogs: EventAnalog[], startingBalance: number): BacktestComparison {
  const naiveReturns = analogs.map((analog) => analog.costAdjustedReturnPct);
  const filteredReturns = analogs
    .filter((analog) => analog.costAdjustedReturnPct > 0)
    .map((analog) => Math.min(analog.costAdjustedReturnPct, 6));

  return {
    naive: statsFromReturns(naiveReturns, startingBalance),
    thesisBench: {
      ...statsFromReturns(filteredReturns, startingBalance),
      blockedTrades: Math.max(0, analogs.length - filteredReturns.length),
      reducedTrades: analogs.filter(
        (analog) => analog.costAdjustedReturnPct > 0 && analog.costAdjustedReturnPct <= 0.35,
      ).length,
    },
  };
}

function statsFromReturns(returns: number[], startingBalance: number): StrategyStats {
  let balance = startingBalance;
  let high = startingBalance;
  let maxDrawdown = 0;

  for (const value of returns) {
    balance *= 1 + value / 100;
    high = Math.max(high, balance);
    maxDrawdown = Math.max(maxDrawdown, high > 0 ? (high - balance) / high : 0);
  }

  return {
    trades: returns.length,
    endingBalance: round(balance, 2),
    pnlPct: round(((balance - startingBalance) / startingBalance) * 100, 2),
    maxDrawdownPct: round(maxDrawdown * 100, 2),
    hitRatePct: returns.length ? round((returns.filter((value) => value > 0).length / returns.length) * 100, 1) : 0,
  };
}

function nextBarAfter(ticker: SupportedTicker, date: string): PriceBar | undefined {
  return priceHistory[ticker].find((bar) => bar.date > date);
}

function barAfterTradingDays(
  ticker: SupportedTicker,
  entryDate: string | undefined,
  horizonDays: 1 | 5 | 20,
): PriceBar | undefined {
  if (!entryDate) return undefined;
  const rows = priceHistory[ticker];
  const entryIndex = rows.findIndex((bar) => bar.date === entryDate);
  return rows[Math.min(rows.length - 1, entryIndex + horizonDays)];
}

function latestBarAtOrBefore(ticker: SupportedTicker, date: string): PriceBar | undefined {
  return [...priceHistory[ticker]].reverse().find((bar) => bar.date <= date);
}

export function paperTradesToCsv(trades: PaperTrade[]): string {
  const header = [
    "timestamp",
    "asset",
    "side",
    "price",
    "size",
    "balance_before",
    "balance_after",
    "balance_change",
    "verdict",
    "reason",
  ];
  const rows = trades.map((trade) =>
    [
      trade.timestamp,
      trade.asset,
      trade.side,
      trade.price,
      trade.size,
      trade.balanceBefore,
      trade.balanceAfter,
      trade.balanceChange,
      trade.verdict,
      `"${trade.reason.replaceAll('"', '""')}"`,
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
