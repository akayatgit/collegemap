"use client";

import { useState, useMemo, useRef } from "react";
import type { CollegeRow, CategoryKey } from "@/lib/types";
import { useStudent } from "@/context/StudentContext";
import EmailReportButton from "./EmailReportButton";

// ── Types ─────────────────────────────────────────────────────────────────────

type DeptInfo  = { key: string; name: string; match: string[] };
type Industry  = { id: string; label: string; icon: string; color: string; blob: string; depts: DeptInfo[] };
type ViewState = "root" | "industry" | "dept";

// ── Industry catalogue ────────────────────────────────────────────────────────

const INDUSTRIES: Industry[] = [
  {
    id: "computing", label: "Computing & AI", icon: "💻", color: "#2563eb", blob: "#bfdbfe",
    depts: [
      { key: "cse",   name: "Computer Science & Engineering",    match: ["COMPUTER SCIENCE AND ENGINEERING"] },
      { key: "it",    name: "Information Technology",            match: ["INFORMATION TECHNOLOGY"] },
      { key: "aids",  name: "AI & Data Science",                 match: ["ARTIFICIAL INTELLIGENCE AND DATA SCIENCE"] },
      { key: "aiml",  name: "AI & Machine Learning",             match: ["AI AND MACHINE LEARNING", "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING"] },
      { key: "csbs",  name: "CS & Business Systems",             match: ["COMPUTER SCIENCE AND BUSINESS SYSTEMS", "BUSINESS SYSTEMS"] },
      { key: "cyber", name: "Cyber Security",                    match: ["CYBER SECURITY", "INFORMATION SECURITY"] },
      { key: "ds",    name: "Data Science",                      match: ["DATA SCIENCE"] },
      { key: "csd",   name: "CS & Design",                       match: ["COMPUTER SCIENCE AND DESIGN"] },
    ],
  },
  {
    id: "electronics", label: "Electronics & Signals", icon: "🔌", color: "#be185d", blob: "#fbcfe8",
    depts: [
      { key: "ece",      name: "Electronics & Communication Engineering",   match: ["ELECTRONICS AND COMMUNICATION ENGINEERING"] },
      { key: "eie",      name: "Electronics & Instrumentation Engineering", match: ["ELECTRONICS AND INSTRUMENTATION ENGINEERING"] },
      { key: "vlsi",     name: "VLSI Design & Technology",                  match: ["VLSI"] },
      { key: "robotics", name: "Robotics & Automation",                     match: ["ROBOTICS AND AUTOMATION"] },
      { key: "med",      name: "Medical Electronics Engineering",           match: ["MEDICAL ELECTRONICS"] },
    ],
  },
  {
    id: "electrical", label: "Electrical & Power", icon: "⚡", color: "#b45309", blob: "#fde68a",
    depts: [
      { key: "eee",  name: "Electrical & Electronics Engineering",  match: ["ELECTRICAL AND ELECTRONICS ENGINEERING"] },
      { key: "ece2", name: "Electrical & Computer Engineering",     match: ["ELECTRICAL AND COMPUTER ENGINEERING"] },
      { key: "ice",  name: "Instrumentation & Control Engineering", match: ["INSTRUMENTATION AND CONTROL ENGINEERING"] },
    ],
  },
  {
    id: "mechanical", label: "Mechanical & Aerospace", icon: "⚙️", color: "#c2410c", blob: "#fed7aa",
    depts: [
      { key: "mech",         name: "Mechanical Engineering",   match: ["MECHANICAL ENGINEERING"] },
      { key: "auto",         name: "Automobile Engineering",   match: ["AUTOMOBILE ENGINEERING"] },
      { key: "aero",         name: "Aeronautical Engineering", match: ["AERONAUTICAL ENGINEERING"] },
      { key: "mfg",          name: "Manufacturing Engineering",match: ["MANUFACTURING ENGINEERING"] },
      { key: "prod",         name: "Production Engineering",   match: ["PRODUCTION ENGINEERING"] },
      { key: "marine",       name: "Marine Engineering",       match: ["MARINE ENGINEERING"] },
      { key: "industrial",   name: "Industrial Engineering",   match: ["INDUSTRIAL ENGINEERING"] },
      { key: "mechatronics", name: "Mechatronics Engineering", match: ["MECHATRONICS"] },
    ],
  },
  {
    id: "civil", label: "Civil & Infrastructure", icon: "🏗️", color: "#4338ca", blob: "#c7d2fe",
    depts: [
      { key: "civil", name: "Civil Engineering",       match: ["CIVIL ENGINEERING"] },
      { key: "geo",   name: "Geo Informatics",         match: ["GEO INFORMATICS"] },
      { key: "arch",  name: "Architecture & Planning", match: ["B.PLAN", "ARCHITECTURE", "TOWN PLANNING"] },
    ],
  },
  {
    id: "chemical", label: "Chemical & Process", icon: "🧪", color: "#065f46", blob: "#a7f3d0",
    depts: [
      { key: "chem",      name: "Chemical Engineering",           match: ["CHEMICAL ENGINEERING"] },
      { key: "petroleum", name: "Petroleum Engineering",          match: ["PETROLEUM ENGINEERING"] },
      { key: "material",  name: "Material Science & Engineering", match: ["MATERIAL SCIENCE"] },
      { key: "mining",    name: "Mining Engineering",             match: ["MINING ENGINEERING"] },
      { key: "petrochem", name: "Petro Chemical Technology",      match: ["PETRO CHEMICAL"] },
    ],
  },
  {
    id: "bio", label: "Bio & Life Sciences", icon: "🧬", color: "#6d28d9", blob: "#ddd6fe",
    depts: [
      { key: "biomedical", name: "Biomedical Engineering",      match: ["BIO MEDICAL ENGINEERING", "BIOMEDICAL ENGINEERING"] },
      { key: "biotech",    name: "Biotechnology",               match: ["INDUSTRIAL BIO TECHNOLOGY", "BIOTECHNOLOGY"] },
      { key: "food",       name: "Food Technology",             match: ["FOOD TECHNOLOGY"] },
      { key: "pharma",     name: "Pharmaceutical Technology",   match: ["PHARMACEUTICAL TECHNOLOGY"] },
      { key: "agri",       name: "Agricultural Engineering",    match: ["AGRICULTURAL ENGINEERING"] },
    ],
  },
  {
    id: "specialised", label: "Specialised Industries", icon: "🏭", color: "#92400e", blob: "#fde68a",
    depts: [
      { key: "textile",  name: "Textile Technology", match: ["TEXTILE TECHNOLOGY"] },
      { key: "leather",  name: "Leather Technology", match: ["LEATHER TECHNOLOGY"] },
      { key: "ceramic",  name: "Ceramic Technology", match: ["CERAMIC TECHNOLOGY"] },
      { key: "printing", name: "Printing & Packing", match: ["PRINTING", "PACKING TECHNOLOGY"] },
      { key: "apparel",  name: "Apparel Technology", match: ["APPAREL TECHNOLOGY"] },
      { key: "rubber",   name: "Rubber & Plastic",   match: ["RUBBER AND PLASTIC"] },
      { key: "fashion",  name: "Fashion Technology", match: ["FASHION TECHNOLOGY"] },
    ],
  },
];

type BubbleConfig = { x: number; y: number; size: number; dur: number; delay: number; amp: number };
const BUBBLE_CONFIGS: BubbleConfig[] = [
  { x: 16, y: 18, size: 172, dur: 4.2, delay: 0,   amp: 13 },
  { x: 60, y:  9, size: 156, dur: 3.8, delay: 0.7, amp: 9  },
  { x: 84, y: 30, size: 144, dur: 4.5, delay: 1.4, amp: 11 },
  { x: 73, y: 65, size: 164, dur: 3.6, delay: 0.3, amp: 7  },
  { x: 25, y: 69, size: 152, dur: 4.1, delay: 1.1, amp: 14 },
  { x:  4, y: 49, size: 138, dur: 3.9, delay: 0.6, amp: 10 },
  { x: 43, y: 35, size: 148, dur: 4.3, delay: 1.8, amp: 8  },
  { x: 51, y: 78, size: 132, dur: 4.0, delay: 0.4, amp: 12 },
];

// ── College grid positions ────────────────────────────────────────────────────
// Spread across full viewport, avoiding:
//   • Title card: left 0–29%, top 0–46%  (top-left glass overlay)
//   • Dept bubble center: left 37–63%, top 37–63%
//   • Edge margins: 5% each side

const MAX_COLLEGES = 22;

const COLLEGE_GRID: Array<{ l: number; t: number }> = (() => {
  const COLS = 9, ROWS = 7;
  const candidates: { l: number; t: number }[] = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Map to 5–94% × 7–92%
      const baseL = 5  + (c / (COLS - 1)) * 89;
      const baseT = 7  + (r / (ROWS - 1)) * 85;

      // Deterministic organic jitter
      const jL = Math.sin(c * 13.7 + r * 9.1) * 2.5;
      const jT = Math.cos(c * 6.3  + r * 17.2) * 2.5;
      const l  = Math.max(5, Math.min(93, baseL + jL));
      const t  = Math.max(7, Math.min(91, baseT + jT));

      // ── Exclusion zones ──
      // Title card: top-left quadrant
      if (l < 30 && t < 47) continue;
      // Dept bubble at center
      if (l > 37 && l < 63 && t > 37 && t < 63) continue;

      candidates.push({ l, t });
    }
  }

  // Deterministic shuffle so the mapping feels spread not row-by-row
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(i * 9.3)) * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return candidates.slice(0, MAX_COLLEGES + 1); // +1 for the "+N more" slot
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseBranch(b: string): string {
  return b.replace(/\s*\(SS\)\s*$/i, "").replace(/\s*\(TAMIL MEDIUM\)\s*$/i, "").trim().toUpperCase();
}

function getCutoffForRow(row: CollegeRow, quota: CategoryKey): number | null {
  const val = row[quota];
  if (val && val !== "—") return parseFloat(val);
  const others = (["oc","bc","bcm","mbc","sc","sca","st"] as CategoryKey[])
    .filter(k => k !== quota)
    .map(k => row[k])
    .filter((v): v is string => !!v && v !== "—")
    .map(v => parseFloat(v))
    .filter(v => !isNaN(v));
  return others.length > 0 ? Math.min(...others) : null;
}

function shortCollegeName(fullName: string): string {
  const primary = fullName.split(",")[0].trim();
  if (primary.length <= 26) return primary;
  const words = primary.split(/\s+/);
  let out = "";
  for (const w of words) {
    if ((out + " " + w).trim().length > 24) break;
    out = (out + " " + w).trim();
  }
  return out + "…";
}

// ── Glass style ───────────────────────────────────────────────────────────────

type GlassVariant = "normal" | "selected" | "red";

function glassStyle(accent: string, variant: GlassVariant = "normal"): React.CSSProperties {
  if (variant === "red") return {
    background: "rgba(254,226,226,0.6)",
    backdropFilter: "blur(20px) saturate(150%)",
    WebkitBackdropFilter: "blur(20px) saturate(150%)",
    border: "1.5px solid rgba(239,68,68,0.5)",
    boxShadow: "0 6px 28px rgba(220,38,38,0.15), inset 0 1.5px 0 rgba(255,255,255,0.85)",
  };
  if (variant === "selected") return {
    background: "rgba(255,255,255,0.44)",
    backdropFilter: "blur(30px) saturate(200%)",
    WebkitBackdropFilter: "blur(30px) saturate(200%)",
    border: "1.5px solid rgba(255,255,255,0.78)",
    boxShadow: [
      "0 16px 56px rgba(0,0,0,0.13)",
      `0 0 0 2px ${accent}55`,
      "inset 0 1.5px 0 rgba(255,255,255,0.95)",
      "inset 0 -1px 0 rgba(255,255,255,0.25)",
    ].join(", "),
  };
  return {
    background: "rgba(255,255,255,0.26)",
    backdropFilter: "blur(22px) saturate(180%)",
    WebkitBackdropFilter: "blur(22px) saturate(180%)",
    border: "1.5px solid rgba(255,255,255,0.62)",
    boxShadow: [
      "0 8px 32px rgba(0,0,0,0.09)",
      `0 0 0 1px ${accent}33`,
      "inset 0 1.5px 0 rgba(255,255,255,0.88)",
      "inset 0 -1px 0 rgba(255,255,255,0.22)",
    ].join(", "),
  };
}

// ── CSS keyframes ─────────────────────────────────────────────────────────────

const KEYFRAMES =
  BUBBLE_CONFIGS.map((c, i) => `
    @keyframes bf-${i} {
      0%,100% { transform: translate(-50%,-50%); }
      33%      { transform: translate(-50%,-50%) translateY(-${c.amp}px) rotate(0.5deg); }
      66%      { transform: translate(-50%,-50%) translateY(-${Math.round(c.amp * 0.45)}px) rotate(-0.7deg); }
    }`).join("") + `
  @keyframes bb   { 0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.032)} }
  @keyframes bob  { 0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)} }
  @keyframes col-pop  { from{opacity:0;transform:scale(0.2)} to{opacity:1;transform:scale(1)} }
  @keyframes col-bob  { 0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)} }
  @keyframes hint-fade { 0%,100%{opacity:.45} 50%{opacity:.95} }
  @keyframes warn-toast {
    0%   { opacity:0; transform:translateX(-50%) translateY(18px); }
    12%  { opacity:1; transform:translateX(-50%) translateY(0); }
    78%  { opacity:1; transform:translateX(-50%) translateY(0); }
    100% { opacity:0; transform:translateX(-50%) translateY(-10px); }
  }
`;

// ── Industry bubble ───────────────────────────────────────────────────────────

function IndustryBubble({ industry, cfg, idx, view, isSelected, onClick }: {
  industry: Industry; cfg: BubbleConfig; idx: number;
  view: ViewState; isSelected: boolean; onClick: () => void;
}) {
  let left: string, top: string, size: number, opacity: number, blurPx: number, anim: string, cursor: string, zIndex: number;

  if (view === "root") {
    left = `${cfg.x}%`; top = `${cfg.y}%`; size = cfg.size;
    opacity = 1; blurPx = 0; zIndex = 10; cursor = "pointer";
    anim = `bf-${idx} ${cfg.dur}s ${cfg.delay}s ease-in-out infinite`;
  } else if (view === "industry") {
    if (isSelected) {
      left = "50%"; top = "50%"; size = 300;
      opacity = 1; blurPx = 0; zIndex = 20; cursor = "default";
      anim = "bb 3.8s ease-in-out infinite";
    } else {
      left = `${cfg.x}%`; top = `${cfg.y}%`; size = Math.round(cfg.size * 0.5);
      opacity = 0.07; blurPx = 6; zIndex = 3; cursor = "default";
      anim = "none";
    }
  } else { // dept view
    if (isSelected) {
      left = "50%"; top = "8%"; size = 76;
      opacity = 0.82; blurPx = 0; zIndex = 8; cursor = "pointer";
      anim = "none";
    } else {
      left = `${cfg.x}%`; top = `${cfg.y}%`; size = 0;
      opacity = 0; blurPx = 0; zIndex = 2; cursor = "default";
      anim = "none";
    }
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); if (cursor === "pointer") onClick(); }}
      style={{
        position: "absolute", left, top, width: size, height: size,
        borderRadius: "50%", cursor,
        zIndex, opacity,
        filter: blurPx > 0 ? `blur(${blurPx}px)` : "none",
        pointerEvents: cursor === "default" ? "none" : "auto",
        transition: [
          "left .65s cubic-bezier(.34,1.4,.64,1)",
          "top .65s cubic-bezier(.34,1.4,.64,1)",
          "width .5s cubic-bezier(.34,1.56,.64,1)",
          "height .5s cubic-bezier(.34,1.56,.64,1)",
          "opacity .45s ease",
          "filter .45s ease",
        ].join(","),
        animation: anim,
        ...glassStyle(industry.color, isSelected && view === "industry" ? "selected" : "normal"),
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 6, textAlign: "center",
        padding: 14, userSelect: "none",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: view === "dept" && isSelected ? "1.9rem" : view === "industry" && isSelected ? "3rem" : "1.5rem", lineHeight: 1 }}>
        {industry.icon}
      </span>
      {!(view === "dept" && isSelected) && (
        <>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: view === "industry" && isSelected ? "0.92rem" : "0.6rem",
            color: view === "industry" && isSelected ? industry.color : "#1a1a1a",
            lineHeight: 1.25, textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            {view === "industry" && isSelected ? industry.label : industry.label.split(" ").slice(0, 2).join("\n")}
          </span>
          {!(view === "industry" && isSelected) && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.5rem", color: "#555" }}>
              {industry.depts.length} depts
            </span>
          )}
          {view === "industry" && isSelected && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#666" }}>
              {industry.depts.length} departments — tap one
            </span>
          )}
        </>
      )}
    </div>
  );
}

// ── Department bubble ─────────────────────────────────────────────────────────

function DeptBubble({ dept, orbDx, orbDy, delay, color, view, isSelected,
  eligible, minCutoff, hasScore, onClick }: {
  dept: DeptInfo; orbDx: number; orbDy: number; delay: number; color: string;
  view: ViewState; isSelected: boolean; eligible: boolean | null;
  minCutoff: number | null; hasScore: boolean; onClick: () => void;
}) {
  const isIneligible = hasScore && eligible === false;
  const dx     = view === "dept" && isSelected ? 0 : orbDx;
  const dy     = view === "dept" && isSelected ? 0 : orbDy;
  const size   = view === "dept" && isSelected ? 190 : 116;
  const opaque = view === "dept" && !isSelected ? 0 : 1;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute",
        left: "50%", top: "50%", width: size, height: size,
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
        borderRadius: "50%",
        cursor: "pointer",
        zIndex: view === "dept" && isSelected ? 25 : 15,
        opacity: opaque,
        pointerEvents: view === "dept" && !isSelected ? "none" : "auto",
        transition: [
          "transform .65s cubic-bezier(.34,1.4,.64,1)",
          "opacity .4s ease",
          "width .5s cubic-bezier(.34,1.56,.64,1)",
          "height .5s cubic-bezier(.34,1.56,.64,1)",
        ].join(","),
        ...glassStyle(color, isSelected && view === "dept" ? "selected" : isIneligible ? "red" : "normal"),
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center",
        padding: "10px 8px", userSelect: "none",
      }}
    >
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 4, width: "100%",
        animation: !isIneligible ? `bob ${3.4 + delay * 0.25}s ${delay + 0.5}s ease-in-out infinite` : "none",
      }}>
        {isIneligible && <span style={{ fontSize: "0.8rem", lineHeight: 1 }}>🚫</span>}
        <span style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: isSelected && view === "dept" ? "0.58rem" : "0.48rem",
          color: isIneligible ? "#b91c1c" : (isSelected && view === "dept" ? color : "#1a1a1a"),
          textTransform: "uppercase", lineHeight: 1.35,
          letterSpacing: "0.02em", wordBreak: "break-word",
          overflowWrap: "break-word", maxWidth: "90%",
        }}>
          {dept.name}
        </span>
        {isIneligible && minCutoff !== null && (
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.42rem", color: "#b91c1c", lineHeight: 1.3 }}>
            need {minCutoff}
          </span>
        )}
      </div>
    </div>
  );
}

// ── College bubble (full-viewport positioned) ─────────────────────────────────

function CollegeBubble({ name, code, pctLeft, pctTop, delay, color, isMore }: {
  name: string; code: string; pctLeft: number; pctTop: number;
  delay: number; color: string; isMore?: boolean;
}) {
  const size = isMore ? 80 : 88;
  return (
    // Outer: absolute position — no transform conflicts
    <div
      style={{
        position: "absolute",
        left: `${pctLeft}%`, top: `${pctTop}%`,
        width: size, height: size,
        zIndex: 30,
        pointerEvents: "none",
      }}
    >
      {/* Inner: glass styling + pop animation */}
      <div style={{
        width: "100%", height: "100%",
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        ...glassStyle(color, isMore ? "selected" : "normal"),
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 2, textAlign: "center",
        padding: "7px 5px", userSelect: "none",
        animation: `col-pop .45s ${delay}s cubic-bezier(.34,1.56,.64,1) both`,
      }}>
        {/* Bob on grandchild to avoid transform conflict */}
        <div style={{ animation: `col-bob ${3.8 + delay * 0.18}s ${delay + 0.45}s ease-in-out infinite` }}>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: isMore ? "0.52rem" : "0.41rem",
            color: isMore ? color : color,
            textTransform: "uppercase", lineHeight: 1.35,
            letterSpacing: "0.01em", wordBreak: "break-word",
            maxWidth: 76, display: "block", textAlign: "center",
          }}>
            {name}
          </span>
          {!isMore && code && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.37rem", color: "#888", display: "block", marginTop: 2, textAlign: "center" }}>
              {code}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Warning toast ─────────────────────────────────────────────────────────────

function IneligibleWarning({ id, deptName, minCutoff, score, quota, onDone }: {
  id: number; deptName: string; minCutoff: number | null;
  score: number; quota: string; onDone: () => void;
}) {
  return (
    <div
      key={id}
      onAnimationEnd={onDone}
      style={{
        position: "absolute",
        bottom: 28, left: "50%",
        zIndex: 100,
        minWidth: 280, maxWidth: 380,
        borderRadius: 18,
        padding: "14px 22px",
        textAlign: "center",
        pointerEvents: "none",
        animation: "warn-toast 3s ease forwards",
        background: "rgba(254,226,226,0.92)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        border: "1.5px solid rgba(239,68,68,0.55)",
        boxShadow: "0 8px 36px rgba(220,38,38,0.2), inset 0 1.5px 0 rgba(255,255,255,0.85)",
      }}
    >
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "#991b1b", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
        🚫 Not eligible for your cutoff
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#7f1d1d", margin: 0, lineHeight: 1.5 }}>
        <strong>{deptName}</strong> requires a minimum of{" "}
        <strong>{minCutoff ?? "higher"}</strong> — your {quota} score is {score}.
        {minCutoff && score < minCutoff
          ? ` You need ${(minCutoff - score).toFixed(1)} more marks.`
          : " Sorry, this one's out of reach for now."}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DepartmentsSection({ data }: { data: CollegeRow[] }) {
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [selectedDeptKey, setSelectedDeptKey] = useState<string | null>(null);
  const [warning, setWarning]             = useState<{ id: number; deptName: string; minCutoff: number | null } | null>(null);
  const warnCounter                       = useRef(0);

  const { score, quota } = useStudent();
  const hasScore  = score !== null && quota !== null;
  const quotaKey  = quota ? (quota.toLowerCase() as CategoryKey) : null;

  // College sets per dept key
  const deptCollegeData = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    for (const row of data) {
      const norm = normaliseBranch(row.branch);
      for (const ind of INDUSTRIES) for (const dept of ind.depts) {
        if (dept.match.some(m => norm.includes(m))) {
          if (!map.has(dept.key)) map.set(dept.key, new Map());
          map.get(dept.key)!.set(row.code, row.collegeName);
          break;
        }
      }
    }
    return map;
  }, [data]);

  const uniqueDeptCount = useMemo(
    () => new Set(data.map(r => normaliseBranch(r.branch))).size, [data]
  );

  // Eligibility
  const { eligibleDeptKeys, deptMinCutoff, eligibleBranchCount } = useMemo(() => {
    if (!hasScore || !quotaKey || score === null)
      return { eligibleDeptKeys: null, deptMinCutoff: new Map<string,number>(), eligibleBranchCount: 0 };

    const eligible   = new Set<string>();
    const minCuts    = new Map<string,number>();
    const eligBranch = new Set<string>();

    for (const row of data) {
      const norm   = normaliseBranch(row.branch);
      const cutoff = getCutoffForRow(row, quotaKey);
      if (cutoff === null) continue;
      const isEl = score >= cutoff;
      if (isEl) eligBranch.add(norm);

      for (const ind of INDUSTRIES) for (const dept of ind.depts) {
        if (dept.match.some(m => norm.includes(m))) {
          const cur = minCuts.get(dept.key);
          if (cur === undefined || cutoff < cur) minCuts.set(dept.key, cutoff);
          if (isEl) eligible.add(dept.key);
          break;
        }
      }
    }
    return { eligibleDeptKeys: eligible, deptMinCutoff: minCuts, eligibleBranchCount: eligBranch.size };
  }, [data, hasScore, quotaKey, score]);

  const view: ViewState     = selectedDeptKey ? "dept" : selectedId ? "industry" : "root";
  const selectedIndustry    = INDUSTRIES.find(i => i.id === selectedId) ?? null;
  const selectedDept        = selectedIndustry?.depts.find(d => d.key === selectedDeptKey) ?? null;

  // Dept orbit positions
  const deptOrbits = useMemo(() => {
    if (!selectedIndustry) return [];
    const n = selectedIndustry.depts.length;
    const r = Math.min(225, 165 + n * 6);
    return selectedIndustry.depts.map((dept, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      return { dept, dx: Math.cos(angle) * r, dy: Math.sin(angle) * r, delay: i * 0.07 };
    });
  }, [selectedIndustry]);

  // College positions: full-viewport grid (pre-computed COLLEGE_GRID positions)
  const collegeItems = useMemo(() => {
    if (!selectedDept || !selectedIndustry) return [];
    const colleges = [...(deptCollegeData.get(selectedDeptKey!) ?? new Map()).entries()];
    const shown    = colleges.slice(0, MAX_COLLEGES);
    const extra    = colleges.length - MAX_COLLEGES;

    const result = shown.map(([code, name], i) => ({
      code, name: shortCollegeName(name),
      pctLeft: COLLEGE_GRID[i]?.l ?? 50,
      pctTop:  COLLEGE_GRID[i]?.t ?? 50,
      delay: i * 0.04,
      isMore: false,
    }));

    if (extra > 0 && COLLEGE_GRID[MAX_COLLEGES]) {
      result.push({
        code: "", name: `+${extra} more`,
        pctLeft: COLLEGE_GRID[MAX_COLLEGES].l,
        pctTop:  COLLEGE_GRID[MAX_COLLEGES].t,
        delay: MAX_COLLEGES * 0.04,
        isMore: true,
      });
    }
    return result;
  }, [selectedDept, selectedDeptKey, selectedIndustry, deptCollegeData]);

  function handleCanvasClick() {
    if (view === "dept")     { setSelectedDeptKey(null); return; }
    if (view === "industry") { setSelectedId(null); return; }
  }

  const blobColor   = selectedIndustry?.blob ?? "#c7d2fe";
  const accentColor = selectedIndustry?.color ?? "var(--color-pink)";
  const eligCount   = hasScore ? eligibleBranchCount : uniqueDeptCount;

  return (
    <section
      id="departments"
      style={{
        position: "relative",
        minHeight: "calc(100vh - 68px)",
        overflow: "hidden",
        background: [
          `radial-gradient(ellipse at 18% 28%, ${blobColor}bb 0%, transparent 48%)`,
          `radial-gradient(ellipse at 78% 15%, #bbf7d0aa 0%, transparent 44%)`,
          `radial-gradient(ellipse at 65% 82%, #fecdd3aa 0%, transparent 44%)`,
          `radial-gradient(ellipse at 30% 75%, #e9d5ffaa 0%, transparent 40%)`,
          `radial-gradient(ellipse at 52% 50%, #fef9c388 0%, transparent 52%)`,
          `#f0f4ff`,
        ].join(","),
        transition: "background 0.8s ease",
        borderTop: "2px solid #e5e5e0",
        borderBottom: "2px solid #e5e5e0",
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* Email report CTA */}
      <div style={{ position: "absolute", right: 20, top: 20, zIndex: 80 }}>
        <EmailReportButton sourcePage="departments" variant="secondary" />
      </div>

      {/* ── Text overlay — always on top, never behind bubbles ── */}
      <div
        style={{
          position: "absolute",
          left: 20, top: 20,
          width: "clamp(210px, 26vw, 300px)",
          zIndex: 70,          // above everything
          borderRadius: 20,
          padding: "20px 18px",
          pointerEvents: "none",
          ...glassStyle("#888", "selected"),
        }}
      >
        <span style={{
          display: "inline-block",
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase",
          color: "#666", border: "1px solid #ccc",
          padding: "2px 8px", borderRadius: 20, marginBottom: 10,
        }}>
          02 · Departments
        </span>

        {hasScore ? (
          <>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.2rem,2.2vw,1.8rem)", color: "var(--color-ink)", margin: "0 0 6px", lineHeight: 1.08, textTransform: "uppercase" }}>
              Choose from{" "}
              <span style={{ color: accentColor }}>{eligCount}</span>
              {" "}of{" "}
              <span style={{ color: "#555" }}>{uniqueDeptCount}</span>{" "}
              departments
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#666", margin: 0, lineHeight: 1.5 }}>
              {eligibleBranchCount === uniqueDeptCount
                ? `Your ${quota} cutoff of ${score} unlocks every field.`
                : `${uniqueDeptCount - eligibleBranchCount} field${uniqueDeptCount - eligibleBranchCount !== 1 ? "s" : ""} need a higher score — shown in red.`}
            </p>
          </>
        ) : (
          <>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.2rem,2.2vw,1.8rem)", color: "var(--color-ink)", margin: "0 0 6px", lineHeight: 1.08, textTransform: "uppercase" }}>
              Explore all{" "}
              <span style={{ color: accentColor }}>{uniqueDeptCount}</span>{" "}
              departments
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#666", margin: 0, lineHeight: 1.5 }}>
              Enter your cutoff above to see eligibility.
            </p>
          </>
        )}

        {view !== "root" && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: accentColor, margin: "12px 0 0", lineHeight: 1.4, fontWeight: 600 }}>
            {selectedIndustry?.icon} {selectedIndustry?.label}
            {selectedDept ? ` › ${selectedDept.name}` : ""}
          </p>
        )}
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", color: "#999", margin: "8px 0 0", lineHeight: 1.4 }}>
          {view === "root"     && "Tap a bubble to explore →"}
          {view === "industry" && "Tap a department to drill in →"}
          {view === "dept"     && `${deptCollegeData.get(selectedDeptKey!)?.size ?? 0} colleges · tap canvas to go back`}
        </p>
      </div>

      {/* ── Bubble canvas ── */}
      <div
        onClick={handleCanvasClick}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Industry bubbles */}
        {INDUSTRIES.map((industry, idx) => (
          <IndustryBubble
            key={industry.id}
            industry={industry} cfg={BUBBLE_CONFIGS[idx]} idx={idx}
            view={view} isSelected={selectedId === industry.id}
            onClick={() => {
              if (view === "dept" && selectedId === industry.id) {
                setSelectedDeptKey(null); // badge → back to industry view
              } else if (view === "industry" && selectedId === industry.id) {
                setSelectedId(null);
              } else {
                setSelectedId(industry.id); setSelectedDeptKey(null);
              }
            }}
          />
        ))}

        {/* Dept orbit bubbles */}
        {selectedIndustry && deptOrbits.map(({ dept, dx, dy, delay }) => {
          const eligible  = eligibleDeptKeys ? eligibleDeptKeys.has(dept.key) : null;
          const minCutoff = deptMinCutoff.get(dept.key) ?? null;
          return (
            <DeptBubble
              key={dept.key}
              dept={dept} orbDx={dx} orbDy={dy} delay={delay}
              color={selectedIndustry.color}
              view={view} isSelected={selectedDeptKey === dept.key}
              eligible={eligible} minCutoff={minCutoff} hasScore={hasScore}
              onClick={() => {
                const isIneligible = hasScore && eligible === false;
                if (isIneligible) {
                  warnCounter.current += 1;
                  setWarning({ id: warnCounter.current, deptName: dept.name, minCutoff });
                } else {
                  setSelectedDeptKey(selectedDeptKey === dept.key ? null : dept.key);
                }
              }}
            />
          );
        })}

        {/* College bubbles — spread across full viewport */}
        {view === "dept" && selectedDept && collegeItems.map(({ code, name, pctLeft, pctTop, delay, isMore }, i) => (
          <CollegeBubble
            key={`${code}-${i}`}
            name={name} code={code}
            pctLeft={pctLeft} pctTop={pctTop}
            delay={delay} color={selectedIndustry!.color}
            isMore={isMore}
          />
        ))}

        {/* Hint */}
        {view === "root" && (
          <div style={{
            position: "absolute", bottom: 28, left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            animation: "hint-fade 2.5s ease-in-out infinite",
          }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "#555",
              ...glassStyle("#888"),
              padding: "7px 22px", borderRadius: 24, margin: 0,
            }}>
              ✦ tap any bubble to see where it leads
            </p>
          </div>
        )}

        {/* Ineligible warning toast */}
        {warning && score !== null && quota !== null && (
          <IneligibleWarning
            key={warning.id}
            id={warning.id}
            deptName={warning.deptName}
            minCutoff={warning.minCutoff}
            score={score}
            quota={quota}
            onDone={() => setWarning(null)}
          />
        )}
      </div>
    </section>
  );
}
