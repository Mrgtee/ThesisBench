import type { PriceBar, SupportedTicker } from "./types";

export async function fetchYahooLatestBar(ticker: SupportedTicker): Promise<PriceBar | undefined> {
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`);
  url.searchParams.set("range", "1mo");
  url.searchParams.set("interval", "1d");

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ThesisBench/0.1 hackathon evidence demo",
      },
      next: { revalidate: 60 },
    });
    if (!response.ok) return undefined;
    const body = (await response.json()) as YahooChartResponse;
    const result = body.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    const timestamps = result?.timestamp ?? [];
    if (!result || !quote || !timestamps.length) return undefined;

    for (let index = timestamps.length - 1; index >= 0; index -= 1) {
      const close = quote.close?.[index];
      const open = quote.open?.[index] ?? close;
      if (!Number.isFinite(close) || !Number.isFinite(open)) continue;
      return {
        date: new Date(timestamps[index] * 1000).toISOString().slice(0, 10),
        ticker,
        open: round(Number(open)),
        high: round(Number(quote.high?.[index] ?? close)),
        low: round(Number(quote.low?.[index] ?? close)),
        close: round(Number(close)),
        volume: Math.round(Number(quote.volume?.[index] ?? 0)),
      };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
  };
};

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
