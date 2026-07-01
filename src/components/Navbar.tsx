"use client";

import { useEffect, useState } from "react";
import { useStudent } from "@/context/StudentContext";
import { fetchAuditStats } from "@/lib/audit";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [pageVisits, setPageVisits] = useState<number | null>(null);
  const { score, quota, preferredDept, setPreferredDept } = useStudent();
  const hasInfo = score !== null && quota !== null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const load = () => {
      fetchAuditStats().then((s) => setPageVisits(s.pageVisits));
    };
    load();
    window.addEventListener("audit-stats-updated", load);
    const interval = setInterval(load, 60_000);
    return () => {
      window.removeEventListener("audit-stats-updated", load);
      clearInterval(interval);
    };
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      suppressHydrationWarning
      style={{
        background: scrolled || hasInfo ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled || hasInfo ? "blur(14px)" : "none",
        borderBottom: scrolled || hasInfo ? "2px solid #0a0a0a" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div
          style={{
            display: "flex", alignItems: "center",
            minHeight: hasInfo ? 52 : 64,
            gap: 12, flexWrap: "wrap",
            paddingTop: hasInfo ? 8 : 0,
            paddingBottom: hasInfo ? 8 : 0,
            transition: "min-height 0.2s ease",
          }}
        >
          {/* Logo — always visible */}
          <a href="/" className="flex items-center gap-2.5" style={{ flexShrink: 0 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", lineHeight: 1 }}>
              ng<span style={{ color: "var(--color-pink)" }}>cult</span>
            </span>
            <span style={{
              padding: "3px 11px", borderRadius: 9999,
              background: "var(--color-ink)", color: "var(--color-yellow)",
              border: "2px solid var(--color-ink)",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.7rem",
            }}>
              CollegeMap
            </span>
          </a>

          {/* Divider */}
          {hasInfo && (
            <div style={{ width: 1, height: 22, background: "#ddd", flexShrink: 0 }} />
          )}

          {/* Cutoff score label + value */}
          {hasInfo && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 14px", borderRadius: 9999,
              background: "var(--color-ink)", color: "var(--color-yellow)",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.74rem",
              letterSpacing: "0.03em", flexShrink: 0,
            }}>
              <span style={{ fontWeight: 400, fontSize: "0.65rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" }}>Cutoff</span>
              {score}
            </span>
          )}

          {/* Quota label + value */}
          {hasInfo && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 14px", borderRadius: 9999,
              border: "2px solid var(--color-ink)", background: "#ffffff",
              color: "var(--color-ink)",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.74rem",
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 400, fontSize: "0.65rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em" }}>Quota</span>
              {quota}
            </span>
          )}

          {/* Preferred dept */}
          {hasInfo && preferredDept && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px 4px 12px", borderRadius: 9999,
              background: "var(--color-yellow)", color: "var(--color-ink)",
              border: "2px solid var(--color-ink)",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.7rem",
              maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flexShrink: 1,
            }}>
              📚 {preferredDept}
              <button
                onClick={() => setPreferredDept(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-ink)", fontWeight: 900, fontSize: "0.75rem",
                  padding: "0 0 0 2px", lineHeight: 1, flexShrink: 0,
                }}
                title="Clear department filter"
              >
                ✕
              </button>
            </span>
          )}

          {/* Page visits — top right */}
          <div style={{ marginLeft: "auto", flexShrink: 0 }}>
            <span
              title="Total page visits"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 9999,
                border: "2px solid var(--color-ink)",
                background: scrolled || hasInfo ? "#ffffff" : "rgba(255,255,255,0.85)",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.68rem",
                color: "var(--color-ink)", letterSpacing: "0.04em",
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>👁</span>
              {pageVisits !== null
                ? pageVisits.toLocaleString("en-IN")
                : "—"}
              <span style={{ fontWeight: 400, fontSize: "0.6rem", color: "#888", textTransform: "uppercase" }}>
                visits
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
