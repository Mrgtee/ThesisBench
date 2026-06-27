"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult, PaperTrade, VerdictKind } from "@/lib/types";

const EXAMPLES = [
  "NVDA beat earnings estimates and raised guidance, buy NVDA for 5 days.",
  "TSLA missed earnings estimates, short TSLA for 1 day.",
  "Fed sounded dovish, buy QQQ for 5 days.",
  "SPCX is a top-performing momentum breakout, buy SPCX for 5 days.",
] as const;

const VERDICT_LABELS: Record<VerdictKind, string> = {
  ALLOW: "Allow",
  REDUCE_SIZE: "Reduce size",
  BLOCK: "Block",
};

export default function ThesisBenchClient() {
  const [thesis, setThesis] = useState<string>(EXAMPLES[0]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisMs, setAnalysisMs] = useState<number | null>(null);

  const parserStatus = result?.parsed.parser === "bitget-qwen"
    ? "Bitget Qwen live"
    : result
      ? "Offline fallback"
      : "Analyzer ready";
  const parserStatusClass = result?.parsed.parser === "bitget-qwen"
    ? "status-live"
    : result
      ? "status-fallback"
      : "";
  const latencyLabel = analysisMs ? ` · ${(analysisMs / 1000).toFixed(1)}s` : "";

  const paperTrades = useMemo(() => {
    if (!result?.verdict.paperTrade) return [];
    return [result.verdict.paperTrade];
  }, [result]);

  async function analyze() {
    setIsLoading(true);
    setError(null);
    setAnalysisMs(null);
    const startedAt = performance.now();
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thesis,
          asOfDate: "2026-06-25",
          startingBalance: 10_000,
          riskProfile: "balanced",
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Analysis failed.");
      setResult(body as AnalysisResult);
      setAnalysisMs(Math.round(performance.now() - startedAt));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function downloadJson() {
    if (!result) return;
    downloadFile("thesisbench-output.json", JSON.stringify(result, null, 2), "application/json");
  }

  function downloadCsv() {
    downloadFile("paper_trading_log.csv", paperTradesToCsv(paperTrades), "text/csv");
  }

  const parsedTickerLabel = result?.parsed.unsupportedAsset
    ? `${result.parsed.requestedTicker} (unsupported)`
    : result?.parsed.ticker;
  const verdict = result?.verdict.verdict ?? "BLOCK";
  const evidence = result?.verdict.evidence;
  const comparison = result?.verdict.comparison;

  return (
    <main className="workspace">
      <header className="topbar">
        <div>
          <h1>ThesisBench</h1>
          <p>Falsifiability layer for US stock AI trading agents.</p>
        </div>
        <div className={`status-stack ${parserStatusClass}`}>
          <span className="status-dot" />
          <span>{parserStatus}{latencyLabel}</span>
        </div>
      </header>

      <section className="command-grid">
        <div className="thesis-panel">
          <div className="panel-heading">
            <span>Trade thesis</span>
            <strong>2026-06-25 as-of date</strong>
          </div>
          <textarea
            value={thesis}
            onChange={(event) => setThesis(event.target.value)}
            aria-label="Trading thesis"
          />
          <div className="example-row">
            {EXAMPLES.map((example) => (
              <button key={example} type="button" onClick={() => setThesis(example)}>
                {example.split(",")[0]}
              </button>
            ))}
          </div>
          <div className="action-row">
            <button className="primary-action" type="button" onClick={analyze} disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Run falsifiability check"}
            </button>
            <button type="button" onClick={downloadJson} disabled={!result}>
              Export JSON
            </button>
            <button type="button" onClick={downloadCsv} disabled={!paperTrades.length}>
              Export CSV
            </button>
          </div>
          {error ? <p className="error-line">{error}</p> : null}
        </div>

        <aside className={`verdict-panel verdict-${verdict.toLowerCase().replace("_", "-")}`}>
          <span className="panel-kicker">Verdict</span>
          <h2>{VERDICT_LABELS[verdict]}</h2>
          <p>{result?.verdict.reason ?? "Run a thesis to generate historical evidence."}</p>
          <div className="verdict-metrics">
            <Metric label="Position" value={`${result?.verdict.positionSizePct ?? 0}%`} />
            <Metric label="Samples" value={String(evidence?.sampleSize ?? 0)} />
            <Metric label="Median edge" value={`${evidence?.costAdjustedEdgePct ?? 0}%`} />
            <Metric label="Hit rate" value={`${evidence?.hitRatePct ?? 0}%`} />
          </div>
        </aside>
      </section>

      <section className="detail-grid">
        <div className="panel parsed-card">
          <div className="panel-heading">
            <span>Parsed hypothesis</span>
            <strong>{result?.parsed.parser ?? "waiting"}</strong>
          </div>
          <dl>
            <Row label="Ticker" value={parsedTickerLabel ?? "-"} />
            <Row label="Event" value={formatEvent(result?.parsed.eventType)} />
            <Row label="Direction" value={result?.parsed.direction ?? "-"} />
            <Row label="Horizon" value={result ? `${result.parsed.horizonDays} trading days` : "-"} />
            <Row label="Claim" value={result?.parsed.claim ?? "-"} />
          </dl>
        </div>

        <div className="panel comparison-card">
          <div className="panel-heading">
            <span>Naive vs ThesisBench</span>
            <strong>same analog set</strong>
          </div>
          <div className="comparison-grid">
            <StrategyBlock title="Naive agent" stats={comparison?.naive} />
            <StrategyBlock title="Filtered agent" stats={comparison?.thesisBench} />
          </div>
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading">
          <span>Historical analogs</span>
          <strong>{result?.verdict.analogs.length ?? 0} shown</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Ticker</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>Direction</th>
                <th>Return</th>
                <th>Descriptor</th>
              </tr>
            </thead>
            <tbody>
              {(result?.verdict.analogs ?? []).map((analog) => (
                <tr key={analog.eventId}>
                  <td>{analog.eventDate}</td>
                  <td>{analog.ticker}</td>
                  <td>{analog.entryDate}</td>
                  <td>{analog.exitDate}</td>
                  <td>{analog.direction}</td>
                  <td className={analog.costAdjustedReturnPct >= 0 ? "positive" : "negative"}>
                    {analog.costAdjustedReturnPct}%
                  </td>
                  <td>{analog.descriptor}</td>
                </tr>
              ))}
              {!result ? (
                <tr>
                  <td colSpan={7}>No analogs yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading">
          <span>Paper trading log</span>
          <strong>submission-ready fields</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Asset</th>
                <th>Side</th>
                <th>Price</th>
                <th>Size</th>
                <th>Balance change</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {paperTrades.map((trade) => (
                <tr key={`${trade.timestamp}-${trade.asset}`}>
                  <td>{trade.timestamp}</td>
                  <td>{trade.asset}</td>
                  <td>{trade.side}</td>
                  <td>{trade.price}</td>
                  <td>{trade.size}</td>
                  <td>{trade.balanceChange}</td>
                  <td>{trade.verdict}</td>
                </tr>
              ))}
              {!paperTrades.length ? (
                <tr>
                  <td colSpan={7}>No paper log generated yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || "-"}</dd>
    </>
  );
}

function StrategyBlock({
  title,
  stats,
}: {
  title: string;
  stats?: AnalysisResult["verdict"]["comparison"]["naive"];
}) {
  return (
    <div className="strategy-block">
      <span>{title}</span>
      <strong>{stats ? `${stats.pnlPct}%` : "-"}</strong>
      <p>{stats ? `${stats.trades} trades / ${stats.maxDrawdownPct}% max DD` : "Waiting for run"}</p>
    </div>
  );
}

function formatEvent(eventType?: string) {
  if (!eventType) return "-";
  return eventType.replaceAll("_", " ");
}

function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function paperTradesToCsv(trades: PaperTrade[]): string {
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
