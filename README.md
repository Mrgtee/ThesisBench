# ThesisBench

ThesisBench is a pre-trade falsifiability layer for US stock AI trading agents, built for the Bitget AI Base Camp Hackathon Season 1.

Instead of letting an AI agent act on a confident market story, ThesisBench turns the story into a structured event hypothesis, tests it against historical analogs, and returns an evidence-backed decision: `ALLOW`, `REDUCE_SIZE`, or `BLOCK`.

## Hackathon Track

**US Stocks AI Trading / Open Innovation**

ThesisBench is a tool for US stock AI trading workflows. It does not place real orders. It produces paper-trading decisions and verifiable run records.

## Problem

AI trading agents often produce persuasive theses such as:

- `NVDA beat earnings estimates, buy for five days.`
- `Fed sounded dovish, buy QQQ.`
- `SPCX is the top-performing momentum name, buy the breakout.`

The problem is that a confident explanation is not evidence. A trading agent needs to know whether similar historical conditions actually produced tradeable edge after costs.

ThesisBench solves this by forcing every thesis through an evidence gate before a paper trade is allowed.

## What The Product Does

1. Accepts a natural-language US stock thesis.
2. Uses Bitget-provided Qwen credits server-side to parse the thesis into structured JSON.
3. Falls back to a deterministic local parser when no Qwen key is available.
4. Matches the thesis to supported evidence paths:
   - earnings surprise events,
   - Fed signal events,
   - momentum-breakout episodes.
5. Computes historical analog returns using no-lookahead entry timing.
6. Returns a verdict, position size, analog table, backtest comparison, and paper-trading log.
7. Exports judge-reviewable JSON and CSV artifacts.

## Supported MVP Universe

| Category | Supported |
| --- | --- |
| Single names | `NVDA`, `TSLA`, `AAPL`, `MSFT`, `META`, `AMZN`, `SPCX` |
| ETFs / index proxies | `SPY`, `QQQ` |
| Event types | `earnings_surprise`, `fed_signal`, `momentum_breakout` |
| Horizons | `1`, `5`, `20` trading days |
| Mode | Paper trading only |

### SPCX Support

`SPCX` is included as a high-momentum newly public asset. ThesisBench treats SPCX theses as `momentum_breakout` evidence, not earnings evidence. The engine uses cross-asset momentum analogs plus cached SPCX price behavior, and the API attempts to use a live public chart quote for the latest paper-trade price.

## Why Not All Assets Yet?

All assets can only be supported honestly with a live data layer for price history, events, and enough comparable analogs. Without that, the system would pretend to have evidence it does not actually have.

Current behavior is deliberate:

- supported assets get evidence-backed verdicts;
- unsupported explicit tickers are blocked with a clear reason;
- no real-money order is ever placed.

## Verdict Rules

The evidence engine uses fixed thresholds:

- `ALLOW`: at least 8 analogs, cost-adjusted median edge above `0.35%`, and hit rate at least `52%`.
- `REDUCE_SIZE`: evidence is non-negative but not strong enough for full paper size.
- `BLOCK`: evidence is negative, too thin, unsupported, or non-directional.

## Bitget Qwen Setup

Create `.env.local`:

```bash
BITGET_QWEN_API_KEY=
BITGET_QWEN_BASE_URL=https://hackathon.bitgetops.com/v1
BITGET_QWEN_MODEL=qwen3.6-plus
BITGET_QWEN_FAST_MODEL=qwen3.6-flash
```

Do not commit `.env.local`.

When the key is present, the UI shows `Bitget Qwen live` after a successful analysis. Without the key, the app still works through the offline fallback parser.

## Local Development

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

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

The paper-trading log includes the required review fields:

```txt
timestamp,asset,side,price,size,balance_before,balance_after,balance_change,verdict,reason
```

## Demo Theses

Use these for a short judge demo:

```txt
NVDA beat earnings estimates and raised guidance, buy NVDA for 5 days.
```

```txt
TSLA missed earnings estimates, short TSLA for 1 day.
```

```txt
Fed sounded dovish, buy QQQ for 5 days.
```

```txt
SPCX is a top-performing momentum breakout, buy SPCX for 5 days.
```

## Project Structure

```txt
src/app/                 Next.js app, dashboard, API route
src/lib/parser.ts        Qwen response normalization and fallback parser
src/lib/qwen.ts          Server-side Bitget Qwen client
src/lib/engine.ts        Event-study, verdict, backtest, paper-trade logic
src/lib/fixtures.ts      Cached reproducible market/event fixtures
src/lib/live-price.ts    Optional live latest-price adapter
runs/                    Generated submission evidence
scripts/                 Evidence generation script
```

## Safety

- Paper trading only.
- No real-money execution.
- No brokerage or exchange order placement.
- API keys are never committed.
- Cached fixtures keep judge runs reproducible without data keys.
