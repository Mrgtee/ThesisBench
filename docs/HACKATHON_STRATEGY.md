# Hackathon Strategy

## Why This Can Score Well

ThesisBench is not a generic trading bot. It solves a narrow workflow problem for AI stock agents: proving a trade thesis before acting on it. This directly matches the US Stocks AI Trading prompt for tools that solve real-world problems in stock-market workflows.

## Core Hypothesis

Event-driven US stock trades should be filtered by historical analog evidence. A thesis-following agent that trades every confident story should perform worse and take lower-quality risk than an agent that blocks or reduces trades when historical analogs are weak.

## Judge-Facing Proof

- Natural-language thesis in.
- Structured event hypothesis out.
- Historical analog table.
- Naive-vs-filtered backtest.
- Paper-trading log.
- Cached data and sample outputs in the repo.

## Risk Controls

- No real-money execution.
- Fixed thresholds documented in code and README.
- Cached data keeps the demo reproducible.
- Qwen output is schema-validated and has a deterministic fallback.

## Bitget AI Usage

- Bitget-provided Qwen key is used server-side when available.
- Base URL: `https://hackathon.bitgetops.com/v1`.
- Primary model: `qwen3.6-plus`.
- Fast fallback model: `qwen3.6-flash`.

## Winning Narrative

Most agents answer, "What should I trade?"

ThesisBench asks, "What would have happened when this exact kind of claim appeared before?"

That turns agentic trading from storytelling into falsifiable decision support.
