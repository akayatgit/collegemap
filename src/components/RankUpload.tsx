"use client";

import { useState, useRef, useEffect } from "react";
import { processRankCsv, save2026ToStorage, clear2026Storage, has2026Data } from "@/lib/rankLookup";

export default function RankUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [has2026, setHas2026] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setHas2026(has2026Data());
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("processing");
    setMessage("Parsing " + file.name + "…");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const dataset = processRankCsv(text);
        save2026ToStorage(dataset);
        setHas2026(true);
        setStatus("done");
        setMessage(
          `2026 data loaded · ${dataset.totalStudents.toLocaleString("en-IN")} students · ${Object.keys(dataset.scoreMap).length} unique scores`
        );
      } catch (err) {
        setStatus("error");
        setMessage("Failed to parse CSV: " + String(err));
      }
    };
    reader.readAsText(file);
  }

  function handleClear() {
    clear2026Storage();
    setHas2026(false);
    setStatus("idle");
    setMessage("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 999,
      fontFamily: "var(--font-body)",
    }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 9999,
          border: "2px solid var(--color-ink)",
          background: has2026 ? "var(--color-teal)" : "var(--color-ink)",
          color: has2026 ? "#fff" : "var(--color-yellow)",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.75rem",
          cursor: "pointer", boxShadow: "3px 3px 0 var(--color-ink)",
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}
      >
        {has2026 ? "✓ 2026 Data Active" : "⬆ Upload 2026 Rank List"}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 12px)", right: 0,
          width: 340, border: "2px solid var(--color-ink)",
          borderRadius: 16, overflow: "hidden",
          background: "#ffffff", boxShadow: "4px 4px 0 var(--color-ink)",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 18px", borderBottom: "2px solid var(--color-ink)",
            background: "var(--color-ink)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", color: "var(--color-yellow)", textTransform: "uppercase" }}>
                Admin · Rank List Upload
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "0.65rem", color: "#aaa" }}>
                Loads 2026 TNEA rank CSV into this browser · share link with team after upload
              </p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "1rem" }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: "16px 18px" }}>
            {has2026 && (
              <div style={{
                marginBottom: 14, padding: "10px 14px", borderRadius: 10,
                background: "#f0fdf4", border: "1.5px solid #86efac",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: "1rem" }}>✅</span>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#15803d", fontWeight: 600 }}>
                  2026 rank data is active in this browser
                </p>
              </div>
            )}

            <p style={{ margin: "0 0 12px", fontSize: "0.77rem", color: "#555", lineHeight: 1.5 }}>
              Upload the TNEA 2026 rank list CSV. Save source file as{" "}
              <code style={{ fontSize: "0.68rem" }}>data/ranks/ACADEMIC_GENERAL_RANK_LIST_2026.csv</code>{" "}
              in the project, then upload here to activate in the browser. Columns:{" "}
              <code style={{ fontSize: "0.68rem" }}>s_no, application_number, aggregate_mark, general_rank, community, community_rank</code>
            </p>

            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, padding: "10px 0", borderRadius: 10,
              border: "2px dashed var(--color-ink)", cursor: "pointer",
              background: "#fafaf8", fontWeight: 700, fontSize: "0.78rem",
              color: "var(--color-ink)", textTransform: "uppercase",
              transition: "background 0.15s",
            }}>
              📂 Choose CSV file
              <input
                ref={fileRef}
                type="file" accept=".csv" style={{ display: "none" }}
                onChange={handleFile}
              />
            </label>

            {status === "processing" && (
              <p style={{ margin: "10px 0 0", fontSize: "0.73rem", color: "#555" }}>⏳ {message}</p>
            )}
            {status === "done" && (
              <p style={{ margin: "10px 0 0", fontSize: "0.73rem", color: "#16a34a", fontWeight: 600 }}>✓ {message}</p>
            )}
            {status === "error" && (
              <p style={{ margin: "10px 0 0", fontSize: "0.73rem", color: "#dc2626" }}>✕ {message}</p>
            )}

            {has2026 && (
              <button
                onClick={handleClear}
                style={{
                  marginTop: 12, width: "100%", padding: "8px 0", borderRadius: 9999,
                  border: "2px solid #dc2626", background: "#fff", color: "#dc2626",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.72rem",
                  cursor: "pointer", textTransform: "uppercase",
                }}
              >
                ✕ Clear 2026 data
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
