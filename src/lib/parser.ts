import type {
  EventType,
  ParsedThesis,
  SupportedTicker,
  ThesisInput,
  TradeDirection,
} from "./types";
import { SUPPORTED_TICKERS } from "./types";

const TICKER_SET = new Set<string>(SUPPORTED_TICKERS);
const HORIZONS = [1, 5, 20] as const;

type Horizon = (typeof HORIZONS)[number];

type RawParsedThesis = Partial<{
  ticker: string;
  eventType: string;
  event_type: string;
  direction: string;
  horizonDays: number | string;
  horizon_days: number | string;
  claim: string;
  confidence: number | string;
}>;

export function fallbackParseThesis(input: ThesisInput): ParsedThesis {
  const text = input.thesis.toUpperCase();
  const ticker = inferTicker(text);
  const eventType = inferEventType(text, ticker);
  const direction = inferDirection(text, eventType);
  const horizonDays = inferHorizon(text);

  return {
    ticker: eventType === "earnings_surprise" && (ticker === "SPY" || ticker === "QQQ") ? "NVDA" : ticker,
    eventType,
    direction,
    horizonDays,
    claim: input.thesis.trim() || "No thesis supplied.",
    confidence: 0.62,
    parser: "offline-fallback",
  };
}

export function parseQwenContent(content: string, input: ThesisInput): ParsedThesis {
  const object = extractJsonObject(content);
  const raw = JSON.parse(object) as RawParsedThesis;
  return normalizeParsedThesis(raw, input, "bitget-qwen");
}

export function normalizeParsedThesis(
  raw: RawParsedThesis,
  input: ThesisInput,
  parser: ParsedThesis["parser"],
): ParsedThesis {
  const fallback = fallbackParseThesis(input);
  const rawTicker = String(raw.ticker ?? fallback.ticker).toUpperCase();
  const ticker = TICKER_SET.has(rawTicker) ? (rawTicker as SupportedTicker) : fallback.ticker;
  const rawEventType = String(raw.eventType ?? raw.event_type ?? fallback.eventType);
  const eventType = normalizeEventType(rawEventType, ticker, fallback.eventType);
  const direction = normalizeDirection(String(raw.direction ?? fallback.direction));
  const horizonDays = normalizeHorizon(raw.horizonDays ?? raw.horizon_days ?? fallback.horizonDays);
  const confidence = clampNumber(Number(raw.confidence ?? fallback.confidence), 0, 1);
  const claim = String(raw.claim ?? fallback.claim).trim().slice(0, 240) || fallback.claim;

  return {
    ticker: eventType === "earnings_surprise" && (ticker === "SPY" || ticker === "QQQ") ? fallback.ticker : ticker,
    eventType,
    direction,
    horizonDays,
    claim,
    confidence,
    parser,
  };
}

function inferTicker(text: string): SupportedTicker {
  for (const ticker of SUPPORTED_TICKERS) {
    if (new RegExp(`\\b${ticker}\\b`, "i").test(text)) return ticker;
  }
  if (text.includes("NASDAQ") || text.includes("TECH")) return "QQQ";
  if (text.includes("S&P") || text.includes("MARKET")) return "SPY";
  return "NVDA";
}

function inferEventType(text: string, ticker: SupportedTicker): EventType {
  if (
    text.includes("FED") ||
    text.includes("FOMC") ||
    text.includes("POWELL") ||
    text.includes("DOVISH") ||
    text.includes("HAWKISH") ||
    ticker === "SPY" ||
    ticker === "QQQ"
  ) {
    return "fed_signal";
  }
  return "earnings_surprise";
}

function inferDirection(text: string, eventType: EventType): TradeDirection {
  if (
    text.includes("SHORT") ||
    text.includes("SELL") ||
    text.includes("MISS") ||
    text.includes("LOWERED") ||
    text.includes("HAWKISH")
  ) {
    return "SHORT";
  }
  if (
    text.includes("BUY") ||
    text.includes("LONG") ||
    text.includes("BEAT") ||
    text.includes("RAISED") ||
    text.includes("DOVISH") ||
    eventType === "fed_signal"
  ) {
    return "LONG";
  }
  return "HOLD";
}

function inferHorizon(text: string): Horizon {
  const match = text.match(/(1|5|20)\s*(DAY|DAYS|D)/i);
  if (match) return Number(match[1]) as Horizon;
  if (text.includes("MONTH") || text.includes("SWING")) return 20;
  if (text.includes("TOMORROW") || text.includes("NEXT SESSION")) return 1;
  return 5;
}

function normalizeEventType(value: string, ticker: SupportedTicker, fallback: EventType): EventType {
  const normalized = value.toLowerCase().replaceAll("-", "_");
  if (normalized.includes("fed") || normalized.includes("fomc") || ticker === "SPY" || ticker === "QQQ") {
    return "fed_signal";
  }
  if (normalized.includes("earning") || normalized.includes("eps")) return "earnings_surprise";
  return fallback;
}

function normalizeDirection(value: string): TradeDirection {
  const normalized = value.toUpperCase();
  if (normalized.includes("SHORT") || normalized.includes("SELL")) return "SHORT";
  if (normalized.includes("LONG") || normalized.includes("BUY")) return "LONG";
  return "HOLD";
}

function normalizeHorizon(value: string | number): Horizon {
  const numeric = Number(value);
  if (numeric <= 1) return 1;
  if (numeric <= 5) return 5;
  return 20;
}

function extractJsonObject(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return extractJsonObject(fenced[1]);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  throw new Error("Qwen response did not include a JSON object.");
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
