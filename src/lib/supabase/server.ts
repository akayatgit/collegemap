import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Agent } from "undici";

let client: SupabaseClient | null = null;

function getSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function createRelaxedFetch(): typeof fetch {
  const agent = new Agent({
    connect: {
      rejectUnauthorized: process.env.SUPABASE_SSL_REJECT_UNAUTHORIZED === "true",
    },
  });

  return (input, init) =>
    fetch(input, {
      ...init,
      // @ts-expect-error undici dispatcher for relaxed TLS on corp networks
      dispatcher: agent,
    });
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) return null;

  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: createRelaxedFetch() },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getServiceRoleKey());
}
