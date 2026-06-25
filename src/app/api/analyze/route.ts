import { NextResponse } from "next/server";
import { analyzeParsedThesis } from "@/lib/engine";
import { parseThesisWithQwen } from "@/lib/qwen";
import type { ThesisInput } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ThesisInput>;
    const thesis = String(body.thesis ?? "").trim();
    if (!thesis) {
      return NextResponse.json({ error: "Thesis is required." }, { status: 400 });
    }

    const input: ThesisInput = {
      thesis,
      asOfDate: body.asOfDate || "2026-06-25",
      startingBalance: Number(body.startingBalance ?? 10_000),
      riskProfile: body.riskProfile === "conservative" ? "conservative" : "balanced",
    };
    const parsed = await parseThesisWithQwen(input);
    return NextResponse.json(analyzeParsedThesis(input, parsed));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Analysis failed.",
      },
      { status: 500 },
    );
  }
}
