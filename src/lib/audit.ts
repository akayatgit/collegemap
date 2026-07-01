"use client";

import type { ReportSnapshot } from "@/lib/types/reportSnapshot";

const SESSION_KEY = "collegemap_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function logPageVisit(): Promise<void> {
  const visited = sessionStorage.getItem("audit_page_visit_logged");
  if (visited) return;

  try {
    const res = await fetch("/api/audit/page-visit", { method: "POST" });
    if (res.ok) {
      sessionStorage.setItem("audit_page_visit_logged", "1");
      window.dispatchEvent(new Event("audit-stats-updated"));
    }
  } catch {
    // silent — analytics should not block UX
  }
}

export type AuditStats = {
  pageVisits: number;
  reportsGenerated: number;
};

export async function fetchAuditStats(): Promise<AuditStats> {
  try {
    const res = await fetch("/api/audit/stats", { cache: "no-store" });
    if (!res.ok) return { pageVisits: 0, reportsGenerated: 0 };
    return res.json();
  } catch {
    return { pageVisits: 0, reportsGenerated: 0 };
  }
}

export type ReportInputPayload = {
  cutoffScore: number;
  rank?: number | null;
  category: string;
  rankContext?: Record<string, unknown> | null;
};

export async function logReportGenerated(payload: ReportInputPayload): Promise<void> {
  try {
    await fetch("/api/audit/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        sessionId: getSessionId(),
      }),
    });
  } catch {
    // silent
  }
}

export type LeadPayload = {
  name: string;
  email: string;
  phone?: string | null;
  sourcePage: string;
  cutoffScore?: number | null;
  rank?: number | null;
  category?: string | null;
  quota?: string | null;
  collegesOpen?: number | null;
  deptCount?: number | null;
  preferredDept?: string | null;
  reportSnapshot?: ReportSnapshot | null;
};

export async function saveLead(payload: LeadPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Failed to save" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error" };
  }
}
