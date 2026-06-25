# ThesisBench PRD

## One-Line Thesis

AI stock-trading agents should not act on confident event narratives until the thesis has been converted into a falsifiable hypothesis and checked against historical analogs.

## Track

Bitget AI Base Camp Hackathon Season 1: US Stocks AI Trading / Open Innovation.

## Problem

US stock agents often produce persuasive explanations such as "NVDA beat earnings, buy for five days" or "Fed sounded dovish, buy QQQ" without verifying whether similar historical events actually produced tradeable edge after costs. This creates narrative-driven paper or live trades that look intelligent but are not falsifiable.

## Product Goal

ThesisBench is a pre-trade evidence layer. It accepts a natural-language trading thesis, uses Bitget Qwen to parse it into a structured event hypothesis, runs a historical event study, and returns one of three decisions:

- `ALLOW`: evidence is strong enough for paper-trade sizing.
- `REDUCE_SIZE`: evidence is mixed but not negative.
- `BLOCK`: evidence is weak, negative, unsupported, or too thin.

## MVP Scope

- Event types: earnings surprise, Fed signal, and momentum breakout.
- Assets: `NVDA`, `TSLA`, `AAPL`, `MSFT`, `META`, `AMZN`, `SPY`, `QQQ`, `SPCX`.
- Trading mode: paper trading only.
- Data mode: cached judge-runnable fixtures, with optional live Qwen parsing.
- Demo mode: no login, no API key required for fallback parser and cached evidence.

## Success Criteria

- A judge can paste a thesis and receive a verdict with evidence in under five seconds on cached data.
- The app produces a paper-trading log with timestamp, asset, side, price, size, and balance change.
- The evidence engine avoids lookahead by trading only after the event timestamp is available.
- The README clearly explains the real-world problem, core hypothesis, Bitget Qwen usage, and run records.
- `npm test` and `npm run build` pass.

## Non-Goals

- Real-money trading.
- Brokerage or Bitget order placement.
- A general news summarizer.
- Guaranteed profitable strategy claims.

## Demo Script

1. Open the public demo.
2. Enter: `NVDA beat earnings estimates, buy NVDA for 5 days.`
3. Show Qwen/fallback structured extraction.
4. Show historical analogs, median return, hit rate, and cost-adjusted edge.
5. Show `ALLOW`, `REDUCE_SIZE`, or `BLOCK`.
6. Export the paper-trading log CSV and sample JSON output.
7. Repeat with `Fed sounded dovish, buy QQQ for 5 days.`

## Submission Checklist

- Public GitHub repository.
- Public demo link.
- README with setup and project description.
- Sample inputs and outputs.
- Paper-trading log.
- Backtest report.
- Data manifest.
- Mention Bitget Qwen endpoint and models used.
