import { NextRequest, NextResponse } from "next/server";
import { insertLead, isStorageConfigured } from "@/lib/db/store";
import { sendReportEmail } from "@/lib/email/sendReportEmail";
import { isSmtpConfigured } from "@/lib/email/smtp";

export async function POST(req: NextRequest) {
  if (!isSmtpConfigured()) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  const body = await req.json();
  const {
    name,
    email,
    phone,
    sourcePage,
    cutoffScore,
    rank,
    category,
    quota,
    collegesOpen,
    deptCount,
    preferredDept,
    reportSnapshot,
  } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (isStorageConfigured()) {
    try {
      await insertLead({
        name: name.trim(),
        email: trimmedEmail,
        phone: phone?.trim() || null,
        sourcePage: sourcePage ?? null,
        cutoffScore: cutoffScore ?? null,
        rank: rank ?? null,
        category: category ?? null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save lead";
      console.error("leads: insertLead failed", { message });
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const mailResult = await sendReportEmail(
    trimmedEmail,
    {
      name: name.trim(),
      cutoffScore,
      rank,
      category,
      quota,
      collegesOpen,
      deptCount,
      preferredDept,
    },
    reportSnapshot ?? null
  );

  if (!mailResult.ok) {
    console.error("leads: sendReportEmail failed", { error: mailResult.error, email: trimmedEmail });
    return NextResponse.json({ error: mailResult.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
