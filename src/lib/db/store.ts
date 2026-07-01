import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export function isStorageConfigured(): boolean {
  return isSupabaseConfigured();
}

export async function incrementPageVisits(): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase.rpc("increment_audit_stat", {
    stat_name: "page_visits",
  });
  if (error) throw new Error(error.message);
}

export async function logReportGenerated(input: {
  cutoffScore?: number | null;
  rank?: number | null;
  category?: string | null;
  rankContext?: Record<string, unknown> | null;
  sessionId?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Database not configured");

  const { error: inputError } = await supabase.from("report_inputs").insert({
    cutoff_score: input.cutoffScore ?? null,
    rank: input.rank ?? null,
    category: input.category ?? null,
    rank_context: input.rankContext ?? null,
    session_id: input.sessionId ?? null,
  });
  if (inputError) throw new Error(inputError.message);

  const { error: statError } = await supabase.rpc("increment_audit_stat", {
    stat_name: "reports_generated",
  });
  if (statError) throw new Error(statError.message);
}

export async function insertLead(input: {
  name: string;
  email: string;
  phone?: string | null;
  sourcePage?: string | null;
  cutoffScore?: number | null;
  rank?: number | null;
  category?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase.from("leads").insert({
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    source_page: input.sourcePage ?? null,
    cutoff_score: input.cutoffScore ?? null,
    rank: input.rank ?? null,
    category: input.category ?? null,
  });
  if (error) throw new Error(error.message);
}

export type AuditStats = {
  pageVisits: number;
  reportsGenerated: number;
};

export async function getAuditStats(): Promise<AuditStats | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("audit_stats")
    .select("page_visits, reports_generated")
    .eq("id", "global")
    .single();

  if (error || !data) return null;

  return {
    pageVisits: Number(data.page_visits) || 0,
    reportsGenerated: Number(data.reports_generated) || 0,
  };
}
