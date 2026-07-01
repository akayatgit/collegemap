import { NextRequest, NextResponse } from "next/server";
import { isStorageConfigured, logReportGenerated } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  if (!isStorageConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const body = await req.json();
    const { cutoffScore, rank, category, rankContext, sessionId } = body;

    await logReportGenerated({
      cutoffScore,
      rank,
      category,
      rankContext,
      sessionId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    console.error("audit/report failed", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
