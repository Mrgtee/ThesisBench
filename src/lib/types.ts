export const SUPPORTED_TICKERS = [
  "NVDA",
  "TSLA",
  "AAPL",
  "MSFT",
  "META",
  "AMZN",
  "SPY",
  "QQQ",
] as const;

export type SupportedTicker = (typeof SUPPORTED_TICKERS)[number];

export type EventType = "earnings_surprise" | "fed_signal";

export type TradeDirection = "LONG" | "SHORT" | "HOLD";

export type VerdictKind = "ALLOW" | "REDUCE_SIZE" | "BLOCK";

export type RiskProfile = "conservative" | "balanced";

export type ThesisInput = {
  thesis: string;
  asOfDate: string;
  startingBalance?: number;
  riskProfile?: RiskProfile;
};

export type ParsedThesis = {
  ticker: SupportedTicker;
  eventType: EventType;
  direction: TradeDirection;
  horizonDays: 1 | 5 | 20;
  claim: string;
  confidence: number;
  parser: "bitget-qwen" | "offline-fallback";
};

export type PriceBar = {
  date: string;
  ticker: SupportedTicker;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type EarningsEvent = {
  id: string;
  ticker: Exclude<SupportedTicker, "SPY" | "QQQ">;
  date: string;
  reportedAfterClose: boolean;
  epsEstimate: number;
  epsActual: number;
  surprisePct: number;
  revenueSurprisePct: number;
  guidance: "raised" | "flat" | "lowered";
};

export type FedEvent = {
  id: string;
  date: string;
  stance: "dovish" | "neutral" | "hawkish";
  rateChangeBps: number;
  summary: string;
};

export type EventRecord = EarningsEvent | FedEvent;

export type EventAnalog = {
  eventId: string;
  ticker: SupportedTicker;
  eventType: EventType;
  eventDate: string;
  entryDate: string;
  exitDate: string;
  direction: Exclude<TradeDirection, "HOLD">;
  entryPrice: number;
  exitPrice: number;
  rawReturnPct: number;
  costAdjustedReturnPct: number;
  descriptor: string;
};

export type EvidenceSummary = {
  sampleSize: number;
  medianReturnPct: number;
  averageReturnPct: number;
  hitRatePct: number;
  costAdjustedEdgePct: number;
  bestReturnPct: number;
  worstReturnPct: number;
};

export type PaperTrade = {
  timestamp: string;
  asset: SupportedTicker;
  side: TradeDirection;
  price: number;
  size: number;
  balanceBefore: number;
  balanceAfter: number;
  balanceChange: number;
  verdict: VerdictKind;
  reason: string;
};

export type BacktestComparison = {
  naive: StrategyStats;
  thesisBench: StrategyStats;
};

export type StrategyStats = {
  trades: number;
  endingBalance: number;
  pnlPct: number;
  maxDrawdownPct: number;
  hitRatePct: number;
  blockedTrades?: number;
  reducedTrades?: number;
};

export type ThesisVerdict = {
  verdict: VerdictKind;
  positionSizePct: number;
  reason: string;
  evidence: EvidenceSummary;
  analogs: EventAnalog[];
  paperTrade?: PaperTrade;
  comparison: BacktestComparison;
};

export type AnalysisResult = {
  input: ThesisInput;
  parsed: ParsedThesis;
  verdict: ThesisVerdict;
  generatedAt: string;
};

export type DataManifest = {
  generatedAt: string;
  mode: "cached-fixtures";
  supportedTickers: SupportedTicker[];
  priceRows: number;
  earningsEvents: number;
  fedEvents: number;
  notes: string[];
};
