import { NextResponse } from "next/server";
import { getAuditStats } from "@/lib/db/store";

export async function GET() {
  try {
    const stats = await getAuditStats();
    if (!stats) {
      return NextResponse.json({ pageVisits: 0, reportsGenerated: 0 });
    }
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
