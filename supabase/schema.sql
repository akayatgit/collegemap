-- Run this in the Supabase SQL Editor to set up AuditLog tables.

-- Aggregate counters (single global row)
CREATE TABLE IF NOT EXISTS audit_stats (
  id text PRIMARY KEY DEFAULT 'global',
  page_visits bigint NOT NULL DEFAULT 0,
  reports_generated bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO audit_stats (id) VALUES ('global')
ON CONFLICT (id) DO NOTHING;

-- Cutoff / rank entries captured during report generation
CREATE TABLE IF NOT EXISTS report_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cutoff_score numeric,
  rank integer,
  category text,
  rank_context jsonb,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lead captures from "Email Report" forms
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  source_page text,
  cutoff_score numeric,
  rank integer,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_inputs_created_at ON report_inputs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);

-- Atomic counter increment helper
CREATE OR REPLACE FUNCTION increment_audit_stat(stat_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF stat_name = 'page_visits' THEN
    UPDATE audit_stats SET page_visits = page_visits + 1, updated_at = now() WHERE id = 'global';
  ELSIF stat_name = 'reports_generated' THEN
    UPDATE audit_stats SET reports_generated = reports_generated + 1, updated_at = now() WHERE id = 'global';
  END IF;
END;
$$;
