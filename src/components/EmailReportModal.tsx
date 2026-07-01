"use client";

import { useState } from "react";
import { saveLead } from "@/lib/audit";
import { useStudent } from "@/context/StudentContext";

type Props = {
  open: boolean;
  onClose: () => void;
  sourcePage: string;
};

export default function EmailReportModal({ open, onClose, sourcePage }: Props) {
  const { score, rank, categoryKey, quota, collegesOpen, deptCount, preferredDept, reportSnapshot } = useStudent();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSubmitting(true);
    const fullPhone = phone.trim() ? `+91${phone.trim().replace(/^\+91/, "")}` : null;

    const result = await saveLead({
      name: name.trim(),
      email: email.trim(),
      phone: fullPhone,
      sourcePage,
      cutoffScore: score,
      rank,
      category: categoryKey,
      quota,
      collegesOpen: collegesOpen || null,
      deptCount: deptCount || null,
      preferredDept,
      reportSnapshot,
    });

    setSubmitting(false);

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setEmail("");
        setPhone("");
        onClose();
      }, 1800);
    } else {
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-report-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(10,10,10,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          border: "2px solid var(--color-ink)",
          borderRadius: 20,
          boxShadow: "8px 8px 0 var(--color-ink)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            background: "var(--color-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              id="email-report-title"
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--color-yellow)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              ✉ Email Your Report
            </h2>
            <p style={{ margin: "4px 0 0", fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#aaa" }}>
              We&apos;ll email your full TNEA report as a downloadable PDF
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "#888",
              fontSize: "1.4rem",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {success ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✅</div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-ink)", margin: 0 }}>
              Got it! Report on the way.
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#888", marginTop: 8 }}>
              Check your inbox — PDF report attached.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "22px 24px 24px" }}>
            <label style={labelStyle}>
              Full Name <span style={{ color: "var(--color-pink)" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arjun Kumar"
              required
              style={inputStyle}
            />

            <label style={{ ...labelStyle, marginTop: 14 }}>
              Email Address <span style={{ color: "var(--color-pink)" }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. arjun@email.com"
              required
              style={inputStyle}
            />

            <label style={{ ...labelStyle, marginTop: 14 }}>
              Phone Number <span style={{ color: "#bbb", fontWeight: 400 }}>(optional)</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "2px solid #e0e0e0",
                  background: "#f5f5f5",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "var(--color-ink)",
                  flexShrink: 0,
                }}
              >
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>

            {score && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#aaa", margin: "14px 0 0" }}>
                Report for cutoff <strong style={{ color: "var(--color-ink)" }}>{score}</strong>
                {categoryKey && <> · {categoryKey.toUpperCase()}</>}
                {rank && <> · Rank {rank.toLocaleString("en-IN")}</>}
              </p>
            )}

            {error && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#dc2626", margin: "12px 0 0" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 18,
                width: "100%",
                padding: "13px 0",
                borderRadius: 12,
                border: "2px solid var(--color-ink)",
                background: submitting ? "#ccc" : "var(--color-yellow)",
                color: "var(--color-ink)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "4px 4px 0 var(--color-ink)",
              }}
            >
              {submitting ? "Sending…" : "Send My Report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontWeight: 700,
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#aaa",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "2px solid #e0e0e0",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  color: "var(--color-ink)",
  outline: "none",
  background: "#fafafa",
};
