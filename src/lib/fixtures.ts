import type {
  DataManifest,
  EarningsEvent,
  FedEvent,
  PriceBar,
  SupportedTicker,
} from "./types";
import { SUPPORTED_TICKERS } from "./types";

const START_DATE = "2022-01-03";
const END_DATE = "2026-06-12";

const BASE_PRICES: Record<SupportedTicker, number> = {
  NVDA: 138,
  TSLA: 265,
  AAPL: 172,
  MSFT: 318,
  META: 260,
  AMZN: 138,
  SPY: 476,
  QQQ: 402,
};

const TICKER_SEEDS: Record<SupportedTicker, number> = {
  NVDA: 11,
  TSLA: 23,
  AAPL: 31,
  MSFT: 43,
  META: 59,
  AMZN: 71,
  SPY: 83,
  QQQ: 97,
};

const EARNINGS_DATES = [
  "2022-02-16",
  "2022-05-25",
  "2022-08-24",
  "2022-11-16",
  "2023-02-22",
  "2023-05-24",
  "2023-08-23",
  "2023-11-21",
  "2024-02-21",
  "2024-05-22",
  "2024-08-28",
  "2024-11-20",
  "2025-02-26",
  "2025-05-28",
  "2025-08-27",
  "2025-11-19",
  "2026-02-25",
  "2026-05-27",
];

const STOCK_TICKERS: EarningsEvent["ticker"][] = [
  "NVDA",
  "TSLA",
  "AAPL",
  "MSFT",
  "META",
  "AMZN",
];

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = toDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

function isWeekday(value: Date): boolean {
  const day = value.getUTCDay();
  return day !== 0 && day !== 6;
}

function tradingDates(start = START_DATE, end = END_DATE): string[] {
  const dates: string[] = [];
  const cursor = toDate(start);
  const final = toDate(end);

  while (cursor <= final) {
    if (isWeekday(cursor)) dates.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export const earningsEvents: EarningsEvent[] = STOCK_TICKERS.flatMap(
  (ticker, tickerIndex) =>
    EARNINGS_DATES.map((date, index) => {
      const surpriseWave = Math.sin(index * 1.17 + tickerIndex * 0.8);
      const guidanceWave = Math.cos(index * 0.91 + tickerIndex * 0.6);
      const surprisePct = Number((surpriseWave * 9 + (ticker === "NVDA" ? 5 : 0)).toFixed(2));
      const revenueSurprisePct = Number((guidanceWave * 5 + surprisePct * 0.18).toFixed(2));
      const guidance =
        surprisePct > 5 && revenueSurprisePct > 1.5
          ? "raised"
          : surprisePct < -5 || revenueSurprisePct < -3
            ? "lowered"
            : "flat";
      const epsEstimate = Number((1.1 + tickerIndex * 0.18 + index * 0.035).toFixed(2));
      const epsActual = Number((epsEstimate * (1 + surprisePct / 100)).toFixed(2));

      return {
        id: `${ticker}-earnings-${date}`,
        ticker,
        date: addDays(date, tickerIndex % 3),
        reportedAfterClose: true,
        epsEstimate,
        epsActual,
        surprisePct,
        revenueSurprisePct,
        guidance,
      };
    }),
);

export const fedEvents: FedEvent[] = [
  {
    id: "fed-2022-03-16",
    date: "2022-03-16",
    stance: "hawkish",
    rateChangeBps: 25,
    summary: "First hike cycle signal with inflation pressure emphasized.",
  },
  {
    id: "fed-2022-06-15",
    date: "2022-06-15",
    stance: "hawkish",
    rateChangeBps: 75,
    summary: "Large hike and restrictive path language.",
  },
  {
    id: "fed-2022-12-14",
    date: "2022-12-14",
    stance: "hawkish",
    rateChangeBps: 50,
    summary: "Higher-for-longer message despite slower hike size.",
  },
  {
    id: "fed-2023-02-01",
    date: "2023-02-01",
    stance: "neutral",
    rateChangeBps: 25,
    summary: "Disinflation acknowledged but policy still data-dependent.",
  },
  {
    id: "fed-2023-06-14",
    date: "2023-06-14",
    stance: "neutral",
    rateChangeBps: 0,
    summary: "Pause with optionality for later hikes.",
  },
  {
    id: "fed-2023-12-13",
    date: "2023-12-13",
    stance: "dovish",
    rateChangeBps: 0,
    summary: "Policy path softened as inflation progress broadened.",
  },
  {
    id: "fed-2024-03-20",
    date: "2024-03-20",
    stance: "dovish",
    rateChangeBps: 0,
    summary: "Growth resilient while cuts remained on the table.",
  },
  {
    id: "fed-2024-06-12",
    date: "2024-06-12",
    stance: "neutral",
    rateChangeBps: 0,
    summary: "Inflation caution balanced against labor-market cooling.",
  },
  {
    id: "fed-2024-09-18",
    date: "2024-09-18",
    stance: "dovish",
    rateChangeBps: -25,
    summary: "Easier path signaled as inflation slowed.",
  },
  {
    id: "fed-2024-12-18",
    date: "2024-12-18",
    stance: "neutral",
    rateChangeBps: 0,
    summary: "Committee emphasized patience and incoming data.",
  },
  {
    id: "fed-2025-03-19",
    date: "2025-03-19",
    stance: "dovish",
    rateChangeBps: -25,
    summary: "Labor cooling and inflation progress supported easier conditions.",
  },
  {
    id: "fed-2025-06-18",
    date: "2025-06-18",
    stance: "hawkish",
    rateChangeBps: 0,
    summary: "Inflation risks reappeared in the statement language.",
  },
  {
    id: "fed-2025-12-17",
    date: "2025-12-17",
    stance: "neutral",
    rateChangeBps: 0,
    summary: "Balanced risks and no strong directional policy signal.",
  },
];

function earningsImpulse(ticker: SupportedTicker, date: string): number {
  const event = earningsEvents.find((candidate) => {
    if (candidate.ticker !== ticker) return false;
    const gap = Math.floor(
      (toDate(date).getTime() - toDate(candidate.date).getTime()) / 86_400_000,
    );
    return gap >= 1 && gap <= 5;
  });

  if (!event) return 0;
  const quality = event.surprisePct / 100 + event.revenueSurprisePct / 180;
  const guidanceBoost = event.guidance === "raised" ? 0.006 : event.guidance === "lowered" ? -0.006 : 0;
  return quality * 0.45 + guidanceBoost;
}

function fedImpulse(ticker: SupportedTicker, date: string): number {
  if (ticker !== "SPY" && ticker !== "QQQ") return 0;
  const event = fedEvents.find((candidate) => {
    const gap = Math.floor(
      (toDate(date).getTime() - toDate(candidate.date).getTime()) / 86_400_000,
    );
    return gap >= 1 && gap <= 5;
  });
  if (!event) return 0;
  const beta = ticker === "QQQ" ? 1.35 : 1;
  if (event.stance === "dovish") return 0.0065 * beta;
  if (event.stance === "hawkish") return -0.006 * beta;
  return 0.0008 * beta;
}

export function generatePriceHistory(ticker: SupportedTicker): PriceBar[] {
  const random = seeded(TICKER_SEEDS[ticker]);
  const bars: PriceBar[] = [];
  let close = BASE_PRICES[ticker];

  tradingDates().forEach((date, index) => {
    const open = close;
    const drift = ticker === "SPY" || ticker === "QQQ" ? 0.00025 : 0.00045;
    const cycle = Math.sin(index / 34 + TICKER_SEEDS[ticker]) * 0.003;
    const noise = (random() - 0.5) * (ticker === "TSLA" ? 0.026 : 0.016);
    const impulse = earningsImpulse(ticker, date) + fedImpulse(ticker, date);
    const nextClose = Math.max(5, open * (1 + drift + cycle + noise + impulse));
    const spread = Math.abs(nextClose - open) + open * (0.006 + random() * 0.012);
    const high = Math.max(open, nextClose) + spread * 0.42;
    const low = Math.max(1, Math.min(open, nextClose) - spread * 0.38);
    const volumeBase = ticker === "SPY" || ticker === "QQQ" ? 65_000_000 : 45_000_000;

    bars.push({
      date,
      ticker,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(nextClose.toFixed(2)),
      volume: Math.round(volumeBase * (0.75 + random() * 0.7 + Math.abs(impulse) * 16)),
    });

    close = nextClose;
  });

  return bars;
}

export const priceHistory: Record<SupportedTicker, PriceBar[]> = SUPPORTED_TICKERS.reduce(
  (accumulator, ticker) => {
    accumulator[ticker] = generatePriceHistory(ticker);
    return accumulator;
  },
  {} as Record<SupportedTicker, PriceBar[]>,
);

export const dataManifest: DataManifest = {
  generatedAt: "2026-06-25T00:00:00.000Z",
  mode: "cached-fixtures",
  supportedTickers: [...SUPPORTED_TICKERS],
  priceRows: Object.values(priceHistory).reduce((sum, rows) => sum + rows.length, 0),
  earningsEvents: earningsEvents.length,
  fedEvents: fedEvents.length,
  notes: [
    "Cached deterministic fixtures keep the hackathon demo runnable without data keys.",
    "The engine treats events as available only after their event date and trades at the next available session.",
    "Live data adapters can replace these fixtures without changing the core verdict API.",
  ],
};
