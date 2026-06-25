# ThesisBench

ThesisBench is a falsifiability layer for US stock AI trading agents, built for the Bitget AI Base Camp Hackathon Season 1.

It turns a natural-language stock thesis into structured evidence before a paper trade is allowed.

## Track

US Stocks AI Trading / Open Innovation.

## Core Problem

AI trading agents can produce confident explanations like "NVDA beat earnings, buy for five days" without proving whether similar events historically had edge. ThesisBench forces those claims into an event-study workflow before action.

## How It Works

1. User enters a thesis.
2. Server-side Bitget Qwen parses it into ticker, event type, direction, horizon, and claim.
3. The fallback parser runs if no Qwen key is available.
4. The evidence engine matches historical analogs from cached earnings and Fed-signal fixtures.
5. ThesisBench returns `ALLOW`, `REDUCE_SIZE`, or `BLOCK`.
6. The app produces a paper-trading log and exports JSON/CSV evidence.

## Supported MVP Scope

- Assets: `NVDA`, `TSLA`, `AAPL`, `MSFT`, `META`, `AMZN`, `SPY`, `QQQ`.
- Event types: earnings surprise and Fed signal.
- Trading mode: paper trading only.
- Data mode: cached fixtures with optional Qwen parsing.

## Bitget Qwen Setup

Create `.env.local`:

```bash
BITGET_QWEN_API_KEY=your-real-key
BITGET_QWEN_BASE_URL=https://hackathon.bitgetops.com/v1
BITGET_QWEN_MODEL=qwen3.6-plus
BITGET_QWEN_FAST_MODEL=qwen3.6-flash
```

Do not commit `.env.local`.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm test
npm run build
npm run evidence
```

## Evidence Artifacts

Generated files live in `runs/`:

- `sample-inputs.json`
- `sample-outputs.json`
- `paper_trading_log.csv`
- `backtest_report.json`
- `data_manifest.json`

## Demo Theses

- `NVDA beat earnings estimates and raised guidance, buy NVDA for 5 days.`
- `TSLA missed earnings estimates, short TSLA for 1 day.`
- `Fed sounded dovish, buy QQQ for 5 days.`

## Safety

- Paper trading only.
- No real-money execution.
- No exchange or brokerage order placement.
- Cached fixtures keep judge runs reproducible without data keys.
