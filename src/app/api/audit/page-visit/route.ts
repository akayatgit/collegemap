import { NextResponse } from "next/server";
import { incrementPageVisits, isStorageConfigured } from "@/lib/db/store";

export async function POST() {
  if (!isStorageConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await incrementPageVisits();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
