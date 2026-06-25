# ThesisBench Submission Draft

## 1. Idea

ThesisBench is a falsifiability layer for US stock AI trading agents. We built it because many AI agents can write convincing market narratives, but they often do not prove whether a thesis has historically worked before producing a trade.

The core hypothesis is simple: event-driven US stock trades should be filtered by historical analog evidence before an agent can act. A statement like "NVDA beat earnings, buy for five days" should become a structured event hypothesis, be compared against similar past earnings events, and only then produce a paper-trade decision.

ThesisBench uses Bitget Qwen to parse natural-language stock theses into strict JSON: ticker, event type, direction, horizon, claim, and confidence. The engine then runs a cached event study over earnings surprise, Fed-signal, and momentum-breakout events. It returns `ALLOW`, `REDUCE_SIZE`, or `BLOCK` based on sample size, median cost-adjusted edge, and hit rate.

This solves a real workflow problem for AI stock agents: it turns confident storytelling into falsifiable pre-trade evidence.

## 2. Progress

Completed:

- Next.js dashboard with no-login demo flow.
- Server-side Bitget Qwen integration path using `https://hackathon.bitgetops.com/v1`.
- Deterministic offline parser fallback when no Qwen key is present.
- Cached price, earnings, and Fed event fixtures for judge reproducibility.
- Event-study engine with no-lookahead entry alignment.
- Verdict engine with fixed thresholds.
- Paper-trading log export with required Track 3 fields.
- Sample inputs, outputs, backtest report, and data manifest.
- Unit tests for parser, engine, no-lookahead behavior, verdict thresholds, and CSV exports.

Still missing / next steps:

- Replace cached fixtures with live licensed US stock data adapters.
- Add analyst upgrade/downgrade event type.
- Publish a hosted demo URL and short demo video.

Frameworks, models, APIs:

- Next.js, React, TypeScript, Vitest.
- Bitget-provided Alibaba Qwen credits through the Bitget proxy.
- Qwen model: `qwen3.6-plus`; fast variant: `qwen3.6-flash`.
- Cached US stock/event fixtures for reproducible judge runs.

## 3. AI Trading Thoughts

Agentic trading needs a falsifiability layer. The future should not be agents that sound more confident; it should be agents that can show when their own thesis is weak, unsupported, or contradicted by historical evidence.
