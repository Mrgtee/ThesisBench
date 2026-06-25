import type { ParsedThesis, ThesisInput } from "./types";
import { fallbackParseThesis, parseQwenContent } from "./parser";

const DEFAULT_BASE_URL = "https://hackathon.bitgetops.com/v1";
const DEFAULT_MODEL = "qwen3.6-plus";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function parseThesisWithQwen(input: ThesisInput): Promise<ParsedThesis> {
  const apiKey = process.env.BITGET_QWEN_API_KEY;
  if (!apiKey) return fallbackParseThesis(input);

  const baseUrl = process.env.BITGET_QWEN_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.BITGET_QWEN_MODEL || DEFAULT_MODEL;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You extract US stock trading theses into strict JSON. Return JSON only, no markdown. Valid tickers: NVDA, TSLA, AAPL, MSFT, META, AMZN, SPY, QQQ. Valid eventType values: earnings_surprise, fed_signal. Valid direction values: LONG, SHORT, HOLD. Valid horizonDays values: 1, 5, 20.",
          },
          {
            role: "user",
            content: `Thesis: ${input.thesis}\nAs-of date: ${input.asOfDate}\nReturn keys: ticker, eventType, direction, horizonDays, claim, confidence.`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`Bitget Qwen request failed: ${response.status}`);
    const body = (await response.json()) as ChatCompletionResponse;
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new Error("Bitget Qwen returned an empty message.");
    return parseQwenContent(content, input);
  } catch {
    return fallbackParseThesis(input);
  }
}
