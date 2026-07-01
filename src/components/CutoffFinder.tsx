"use client";

import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import type { CollegeRow, CategoryKey } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import type { MapCollegeEntry } from "./CollegeMap";
import { useStudent } from "@/context/StudentContext";
import {
  scoreToRanks,
  rankToScore,
  has2026Data,
  initBundledRankData,
} from "@/lib/rankLookup";
import { logReportGenerated } from "@/lib/audit";
import EmailReportModal from "./EmailReportModal";
import EmailReportButton from "./EmailReportButton";

const CollegeMap = lazy(() => import("./CollegeMap"));

const CATEGORIES: CategoryKey[] = ["oc", "bc", "bcm", "mbc", "sc", "sca", "st"];

// ── City extraction ───────────────────────────────────────────────────────────

const CITY_KEYWORDS: [string, string][] = [
  ["Chennai", "Chennai"], ["Guindy", "Chennai"], ["Chrompet", "Chennai"],
  ["Tambaram", "Chennai"], ["Coimbatore", "Coimbatore"], ["Thadagam", "Coimbatore"],
  ["Vellore", "Vellore"], ["Bagayam", "Vellore"], ["Madurai", "Madurai"],
  ["Trichy", "Trichy"], ["Tiruchirappalli", "Trichy"], ["Salem", "Salem"],
  ["Thanjavur", "Thanjavur"], ["Tirunelveli", "Tirunelveli"], ["Erode", "Erode"],
  ["Tirupur", "Tirupur"], ["Puducherry", "Puducherry"],
  ["Chengalpattu", "Chengalpattu"], ["Kanchipuram", "Kanchipuram"],
];

function extractCity(name: string): string {
  for (const [kw, city] of CITY_KEYWORDS) {
    if (name.toLowerCase().includes(kw.toLowerCase())) return city;
  }
  const m = name.match(/(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+District/);
  if (m) return m[1];
  return "Tamil Nadu";
}

// ── Branch normalisation ──────────────────────────────────────────────────────

function normaliseBranch(b: string): string {
  return b
    .replace(/\s*\(SS\)\s*$/i, "")
    .replace(/\s*\(TAMIL MEDIUM\)\s*$/i, "")
    .trim()
    .toUpperCase();
}

// ── Fallback cutoff ───────────────────────────────────────────────────────────
// "—" means no seats in that quota for 2025.
// Fallback: use the minimum cutoff of all other quotas as a conservative estimate.

function getEffectiveCutoff(
  row: CollegeRow,
  category: CategoryKey
): { cutoff: number; isEstimated: boolean } {
  const direct = parseFloat(row[category]);
  if (!isNaN(direct)) return { cutoff: direct, isEstimated: false };
  const others = CATEGORIES.filter((c) => c !== category)
    .map((c) => parseFloat(row[c]))
    .filter((n) => !isNaN(n));
  if (others.length === 0) return { cutoff: NaN, isEstimated: false };
  return { cutoff: Math.min(...others), isEstimated: true };
}

// ── Industry classification ───────────────────────────────────────────────────

type IndustryGroup = { label: string; color: string; match: string[] };

const INDUSTRY_GROUPS: IndustryGroup[] = [
  { label: "Computing & AI",     color: "#0284c7", match: ["COMPUTER SCIENCE", "INFORMATION TECHNOLOGY", "ARTIFICIAL INTELLIGENCE", "DATA SCIENCE", "CYBER SECURITY", "MACHINE LEARNING", "BUSINESS SYSTEMS"] },
  { label: "Electronics",         color: "#db2777", match: ["ELECTRONICS AND COMMUNICATION", "ELECTRONICS AND INSTRUMENTATION", "VLSI", "ROBOTICS AND AUTOMATION"] },
  { label: "Electrical & Power",  color: "#d97706", match: ["ELECTRICAL AND ELECTRONICS"] },
  { label: "Mechanical & Aero",   color: "#ea580c", match: ["MECHANICAL", "AUTOMOBILE", "AERONAUTICAL", "MANUFACTURING ENGINEERING", "PRODUCTION ENGINEERING", "MARINE", "INDUSTRIAL ENGINEERING"] },
  { label: "Civil & Infra",       color: "#4f46e5", match: ["CIVIL ENGINEERING", "GEO INFORMATICS", "B.PLAN", "ARCHITECTURE"] },
  { label: "Chemical & Process",  color: "#059669", match: ["CHEMICAL ENGINEERING", "PETROLEUM ENGINEERING", "MATERIAL SCIENCE", "MINING ENGINEERING"] },
  { label: "Bio & Life Sciences", color: "#7c3aed", match: ["BIO MEDICAL", "BIOTECHNOLOGY", "FOOD TECHNOLOGY", "PHARMACEUTICAL", "INDUSTRIAL BIO"] },
  { label: "Specialised",         color: "#b45309", match: ["TEXTILE", "LEATHER", "CERAMIC", "PRINTING", "APPAREL", "RUBBER AND PLASTIC"] },
];

function classifyDept(norm: string): IndustryGroup {
  for (const g of INDUSTRY_GROUPS) {
    if (g.match.some((m) => norm.includes(m))) return g;
  }
  return { label: "Other", color: "#888", match: [] };
}

// ── SVG Donut Chart ───────────────────────────────────────────────────────────

type Segment = { label: string; value: number; color: string };

function DonutChart({ segments, total }: { segments: Segment[]; total: number }) {
  if (total === 0) return null;
  const cx = 110, cy = 110, R = 88, r = 58, GAP = 0.025;
  let cum = 0;
  const paths = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const sa = (cum / total) * 2 * Math.PI - Math.PI / 2 + GAP / 2;
      cum += seg.value;
      const ea = (cum / total) * 2 * Math.PI - Math.PI / 2 - GAP / 2;
      const la = seg.value / total > 0.5 ? 1 : 0;
      const x1 = cx + R * Math.cos(sa), y1 = cy + R * Math.sin(sa);
      const x2 = cx + R * Math.cos(ea), y2 = cy + R * Math.sin(ea);
      const x3 = cx + r * Math.cos(ea), y3 = cy + r * Math.sin(ea);
      const x4 = cx + r * Math.cos(sa), y4 = cy + r * Math.sin(sa);
      return {
        ...seg,
        d: `M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 ${la} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} A${r} ${r} 0 ${la} 0 ${x4.toFixed(1)} ${y4.toFixed(1)}Z`,
      };
    });
  return (
    <svg viewBox="0 0 220 220" style={{ width: "100%", maxWidth: 200 }}>
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
      <text x="110" y="101" textAnchor="middle" fontFamily="var(--font-display)" fontSize={28} fontWeight={700} fill="#0a0a0a">
        {total}
      </text>
      <text x="110" y="117" textAnchor="middle" fontFamily="var(--font-body)" fontSize={10} fill="#aaa">
        departments
      </text>
      <text x="110" y="130" textAnchor="middle" fontFamily="var(--font-body)" fontSize={9} fill="#ccc">
        accessible
      </text>
    </svg>
  );
}

// ── College summary ───────────────────────────────────────────────────────────

type CollegeSummary = {
  code: string;
  name: string;
  city: string;
  bestDept: string;
  bestCutoff: number;
  margin: number;
  eligibleDepts: number;
  hasEstimated: boolean;
};

function getTopColleges(
  eligible: CollegeRow[],
  category: CategoryKey,
  score: number,
  filterCity?: string
): CollegeSummary[] {
  const map = new Map<string, {
    name: string; city: string;
    depts: { dept: string; cutoff: number; isEstimated: boolean }[];
  }>();
  for (const row of eligible) {
    const city = extractCity(row.collegeName);
    if (filterCity && city !== filterCity) continue;
    const { cutoff, isEstimated } = getEffectiveCutoff(row, category);
    if (isNaN(cutoff)) continue;
    if (!map.has(row.code)) {
      map.set(row.code, { name: row.collegeName.split(",")[0].trim(), city, depts: [] });
    }
    map.get(row.code)!.depts.push({ dept: normaliseBranch(row.branch), cutoff, isEstimated });
  }
  return [...map.entries()]
    .map(([code, info]) => {
      const bestCutoff = Math.max(...info.depts.map((d) => d.cutoff));
      const best = info.depts.find((d) => d.cutoff === bestCutoff)!;
      return {
        code,
        name: info.name,
        city: info.city,
        bestDept: best.dept,
        bestCutoff,
        margin: parseFloat((score - bestCutoff).toFixed(1)),
        eligibleDepts: info.depts.length,
        hasEstimated: info.depts.some((d) => d.isEstimated),
      };
    })
    .sort((a, b) => b.bestCutoff - a.bestCutoff);
}

// ── College Card ──────────────────────────────────────────────────────────────

function CollegeCard({ college, rank, accent }: {
  college: CollegeSummary;
  rank: number;
  accent: "yellow" | "pink";
}) {
  const isTop = rank === 0;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "11px 13px", borderRadius: 12,
      background: isTop ? (accent === "yellow" ? "#fffef0" : "#fff0f5") : "#fafaf8",
      border: "1.5px solid",
      borderColor: isTop ? (accent === "yellow" ? "#ede617" : "var(--color-pink)") : "#ebebeb",
    }}>
      {/* Rank */}
      <div style={{
        minWidth: 26, width: 26, height: 26, borderRadius: "50%",
        background: isTop ? (accent === "yellow" ? "var(--color-yellow)" : "var(--color-pink)") : "#f0f0f0",
        border: "2px solid var(--color-ink)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.68rem",
        color: "var(--color-ink)", flexShrink: 0,
      }}>
        {rank + 1}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
          <span style={{
            padding: "1px 6px", borderRadius: 9999,
            background: "var(--color-ink)", color: "var(--color-yellow)",
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.6rem", flexShrink: 0,
          }}>
            {college.code}
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.63rem", color: "#bbb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {college.city} · {college.eligibleDepts} dept{college.eligibleDepts !== 1 ? "s" : ""}
          </span>
          {college.hasEstimated && (
            <span title="Some cutoffs estimated from other quotas" style={{ fontSize: "0.6rem", color: "#f59e0b", flexShrink: 0 }}>⚠</span>
          )}
        </div>
        <p style={{ margin: 0, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.78rem", color: "#0a0a0a", lineHeight: 1.35, maxHeight: "2.1rem", overflow: "hidden" }}>
          {college.name}
        </p>
        <p style={{ margin: "3px 0 0", fontFamily: "var(--font-body)", fontSize: "0.67rem", color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {college.bestDept}
        </p>
      </div>

      {/* Score */}
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-teal)", lineHeight: 1 }}>
          {college.bestCutoff}
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "#ccc", marginTop: 1 }}>cutoff</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.7rem", color: "#16a34a", marginTop: 3 }}>
          +{college.margin}
        </div>
      </div>
    </div>
  );
}

// ── Show More Button ──────────────────────────────────────────────────────────

function ShowMoreBtn({ remaining, onClick }: { remaining: number; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      marginTop: 10, width: "100%", padding: "9px 0",
      borderRadius: 10, border: "1.5px solid #ddd",
      background: "#f8f8f6", color: "#555",
      fontFamily: "var(--font-display)", fontWeight: 700,
      fontSize: "0.75rem", textTransform: "uppercase",
      letterSpacing: "0.06em", cursor: "pointer",
    }}>
      Show more · {remaining} remaining
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CutoffFinder({ data }: { data: CollegeRow[] }) {
  const [cutoff, setCutoff] = useState("");
  const [category, setCategory] = useState<CategoryKey>("oc");
  const [chennaiVisible, setChennaiVisible] = useState(6);
  const [tnVisible, setTnVisible] = useState(6);
  const [preferredDept, setPreferredDept] = useState<string | null>(null);
  const [deptPickerOpen, setDeptPickerOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // ── Rank feature state ────────────────────────────────────────────────────
  const [rankInput, setRankInput] = useState("");
  const [rankMounted, setRankMounted] = useState(false);
  const [rankDataReady, setRankDataReady] = useState(false);

  useEffect(() => {
    setRankMounted(true);
    const sync = () => setRankDataReady(has2026Data());
    sync();
    window.addEventListener("rank2026-updated", sync);
    // Auto-load bundled 2026 data from /data/rank2026.json
    initBundledRankData();
    return () => window.removeEventListener("rank2026-updated", sync);
  }, []);

  // ── Push live state into the shared Navbar context ────────────────────────
  const { setStudentInfo, setPreferredDept: setGlobalDept, setReportSnapshot, clearAll } = useStudent();

  const score = parseFloat(cutoff);
  const hasResult = !isNaN(score) && score > 0 && score <= 200;

  useEffect(() => {
    setChennaiVisible(6);
    setTnVisible(6);
    setPreferredDept(null);
    setDeptPickerOpen(false);
    if (!hasResult) clearAll();
  }, [score, category, hasResult, clearAll]);

  const totalCollegesInDataset = useMemo(() => new Set(data.map((r) => r.code)).size, [data]);
  const totalUniqueDepts = useMemo(() => new Set(data.map((r) => normaliseBranch(r.branch))).size, [data]);

  const results = useMemo(() => {
    if (!hasResult) return null;

    const eligibleWithMeta = data
      .map((row) => {
        const { cutoff: effCutoff, isEstimated } = getEffectiveCutoff(row, category);
        return { row, effCutoff, isEstimated };
      })
      .filter(({ effCutoff }) => !isNaN(effCutoff) && score >= effCutoff);

    const eligible = eligibleWithMeta.map((e) => e.row);
    const estimatedCount = eligibleWithMeta.filter((e) => e.isEstimated).length;
    const uniqueColleges = new Set(eligible.map((r) => r.code)).size;

    const bestMargin = parseFloat(
      eligibleWithMeta.reduce((best, { effCutoff }) => {
        const m = score - effCutoff;
        return m > best ? m : best;
      }, 0).toFixed(1)
    );

    // ── Department map ────────────────────────────────────────────────────────
    const deptMap = new Map<string, { minCutoff: number; maxCutoff: number; colleges: Set<string> }>();
    for (const { row, effCutoff } of eligibleWithMeta) {
      if (isNaN(effCutoff)) continue;
      const norm = normaliseBranch(row.branch);
      const existing = deptMap.get(norm);
      if (!existing) {
        deptMap.set(norm, { minCutoff: effCutoff, maxCutoff: effCutoff, colleges: new Set([row.code]) });
      } else {
        existing.colleges.add(row.code);
        if (effCutoff < existing.minCutoff) existing.minCutoff = effCutoff;
        if (effCutoff > existing.maxCutoff) existing.maxCutoff = effCutoff;
      }
    }

    const uniqueDepts = deptMap.size;

    // ── Industry segments for donut ────────────────────────────────────────────
    const industryCountMap = new Map<string, { color: string; count: number }>();
    for (const norm of deptMap.keys()) {
      const g = classifyDept(norm);
      const prev = industryCountMap.get(g.label);
      if (!prev) industryCountMap.set(g.label, { color: g.color, count: 1 });
      else prev.count++;
    }
    const industrySegments: Segment[] = [
      ...INDUSTRY_GROUPS
        .filter((g) => industryCountMap.has(g.label))
        .map((g) => ({ label: g.label, color: g.color, value: industryCountMap.get(g.label)!.count })),
      ...(industryCountMap.has("Other")
        ? [{ label: "Other", color: "#888", value: industryCountMap.get("Other")!.count }]
        : []),
    ];

    // ── Department table (sorted by max cutoff desc = most competitive first) ─
    const deptTable = [...deptMap.entries()]
      .map(([dept, info]) => ({
        dept,
        minCutoff: parseFloat(info.minCutoff.toFixed(1)),
        maxCutoff: parseFloat(info.maxCutoff.toFixed(1)),
        collegeCount: info.colleges.size,
      }))
      .sort((a, b) => b.maxCutoff - a.maxCutoff);

    // ── City distribution ──────────────────────────────────────────────────────
    const cityMap = new Map<string, Set<string>>();
    for (const row of eligible) {
      const city = extractCity(row.collegeName);
      if (!cityMap.has(city)) cityMap.set(city, new Set());
      cityMap.get(city)!.add(row.code);
    }
    const cityDistribution = [...cityMap.entries()]
      .map(([city, codes]) => ({ city, count: codes.size }))
      .sort((a, b) => b.count - a.count);

    const chennaiTop = getTopColleges(eligible, category, score, "Chennai");
    const tnTop = getTopColleges(eligible, category, score);

    return {
      total: eligible.length,
      uniqueColleges,
      uniqueDepts,
      estimatedCount,
      industrySegments,
      deptTable,
      cityDistribution,
      chennaiTop,
      tnTop,
      bestMargin,
      eligibleRows: eligible,
    };
  }, [data, score, category, hasResult]);

  const allDeptsOpen = results ? results.uniqueDepts === totalUniqueDepts : false;

  // ── Rank auto-fill: whenever rank resolves, update cutoff + community ────────
  const parsedRank = parseInt(rankInput, 10);
  const hasValidRank = rankDataReady && !isNaN(parsedRank) && parsedRank > 0;

  useEffect(() => {
    if (!hasValidRank) return;
    const res = rankToScore(parsedRank);
    if (res) {
      setCutoff(res.score.toString());
      if (res.community) {
        setCategory(res.community.toLowerCase() as CategoryKey);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankInput, hasValidRank]);

  // ── 2025 rank context for current cutoff ──────────────────────────────────────
  const rankContext = useMemo(() => {
    if (!hasResult) return null;
    return scoreToRanks(score, category.toUpperCase() as import("@/lib/rankLookup").CommunityKey);
  }, [hasResult, score, category]);

  // ── Rank-input context (what score that rank had in 2025) ─────────────────────
  const rankLookupResult = useMemo(() => {
    if (!hasValidRank) return null;
    return rankToScore(parsedRank);
  }, [hasValidRank, parsedRank]);

  // ── Sync into Navbar context ──────────────────────────────────────────────────
  useEffect(() => {
    if (results && hasResult) {
      setStudentInfo({
        score,
        quota: CATEGORY_LABELS[category],
        categoryKey: category,
        rank: hasValidRank ? parsedRank : null,
        collegesOpen: results.uniqueColleges,
        deptCount: results.uniqueDepts,
      });
    }
  }, [results, hasResult, score, category, hasValidRank, parsedRank, setStudentInfo]);

  const handleGenerateReport = () => {
    logReportGenerated({
      cutoffScore: score,
      rank: hasValidRank ? parsedRank : null,
      category: category.toUpperCase(),
      rankContext: rankContext
        ? {
            genMin: rankContext.genMin,
            genMax: rankContext.genMax,
            percentile: rankContext.percentile,
            year: rankContext.year,
          }
        : null,
    });
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    setEmailModalOpen(true);
  };

  useEffect(() => {
    setGlobalDept(preferredDept);
  }, [preferredDept, setGlobalDept]);

  // ── Map entries ───────────────────────────────────────────────────────────────
  const mapEntries = useMemo((): MapCollegeEntry[] => {
    if (!results) return [];
    const grouped = new Map<string, Map<string, string>>();
    for (const row of results.eligibleRows) {
      const city = extractCity(row.collegeName);
      if (!grouped.has(city)) grouped.set(city, new Map());
      grouped.get(city)!.set(row.code, row.collegeName.split(",")[0].trim());
    }
    return [...grouped.entries()]
      .map(([city, colleges]) => ({
        city,
        count: colleges.size,
        colleges: [...colleges.entries()].map(([code, name]) => ({ code, name })),
      }))
      .sort((a, b) => b.count - a.count);
  }, [results]);

  // ── Department-filtered college lists ────────────────────────────────────────
  const filteredChennaiTop = useMemo(() => {
    if (!results) return [];
    if (!preferredDept) return results.chennaiTop;
    const deptRows = results.eligibleRows.filter(
      (r) => normaliseBranch(r.branch) === preferredDept
    );
    return getTopColleges(deptRows, category, score, "Chennai");
  }, [results, preferredDept, category, score]);

  const filteredTnTop = useMemo(() => {
    if (!results) return [];
    if (!preferredDept) return results.tnTop;
    const deptRows = results.eligibleRows.filter(
      (r) => normaliseBranch(r.branch) === preferredDept
    );
    return getTopColleges(deptRows, category, score);
  }, [results, preferredDept, category, score]);

  // Alphabetically sorted dept options for the picker
  const deptOptions = useMemo(() => {
    if (!results) return [];
    return [...results.deptTable]
      .sort((a, b) => a.dept.localeCompare(b.dept));
  }, [results]);

  // ── Sync full report snapshot for PDF email ─────────────────────────────────
  useEffect(() => {
    if (!results || !hasResult) {
      setReportSnapshot(null);
      return;
    }
    setReportSnapshot({
      cutoffScore: score,
      category,
      rank: hasValidRank ? parsedRank : null,
      uniqueColleges: results.uniqueColleges,
      uniqueDepts: results.uniqueDepts,
      totalCollegesInDataset,
      bestMargin: results.bestMargin,
      estimatedCount: results.estimatedCount,
      chennaiPicks: filteredChennaiTop.length,
      preferredDept,
      rankContext: rankContext
        ? {
            year: rankContext.year,
            totalStudents: rankContext.totalStudents,
            genMin: rankContext.genMin,
            genMax: rankContext.genMax,
            commMin: rankContext.community?.commMin ?? null,
            commMax: rankContext.community?.commMax ?? null,
            percentile: rankContext.percentile,
            studentsAbove: rankContext.studentsAbove,
          }
        : null,
      industrySegments: results.industrySegments.map((s) => ({
        label: s.label,
        value: s.value,
      })),
      cityDistribution: results.cityDistribution,
      deptTable: results.deptTable,
      chennaiTop: filteredChennaiTop,
      tnTop: filteredTnTop,
    });
  }, [
    results,
    hasResult,
    score,
    category,
    hasValidRank,
    parsedRank,
    rankContext,
    preferredDept,
    filteredChennaiTop,
    filteredTnTop,
    totalCollegesInDataset,
    setReportSnapshot,
  ]);

  return (
    <section style={{ background: "#ffffff" }}>

      {/* ── Input Panel ── */}
      <div className="noise-overlay relative overflow-hidden" style={{ background: "var(--color-yellow)" }}>
        <div className="blob-pink absolute -right-20 top-20 w-64 h-64 lg:w-80 lg:h-80 opacity-70" aria-hidden />
        <div className="blob-teal absolute -left-16 bottom-0 w-48 h-48 opacity-50" aria-hidden />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-10 lg:gap-16">
            <div className="flex-1">
              <span className="pill mb-5 inline-flex text-xs uppercase tracking-widest" style={{
                background: "var(--color-ink)", color: "var(--color-yellow)",
                border: "2px solid var(--color-ink)", fontFamily: "var(--font-body)",
              }}>
                🎓 &nbsp; TNEA 2026 · Tamil Nadu Engineering Counselling
              </span>
              <h1 className="leading-tight tracking-tight" style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "clamp(2.2rem,6.5vw,4.6rem)", color: "var(--color-ink)",
                textTransform: "uppercase",
              }}>
                Your Cutoff.
                <br />
                Your Rank.
                <br />
                <span style={{ color: "var(--color-pink)" }}>Your College.</span>
              </h1>
              <p className="mt-4 max-w-md" style={{
                fontFamily: "var(--font-body)", fontSize: "1rem",
                color: "var(--color-ink-soft)", lineHeight: 1.65,
              }}>
                Drop your TNEA 2026 cutoff score or rank — we&apos;ll instantly generate a personalised report showing every college and department you qualify for, your rank context from last year, and your best picks across Tamil Nadu.
              </p>
            </div>

            {/* Input card */}
            <div style={{
              background: "#ffffff", border: "2px solid var(--color-ink)",
              borderRadius: 20, padding: "24px 26px",
              boxShadow: "6px 6px 0 var(--color-ink)",
              width: "100%", maxWidth: 380, flexShrink: 0,
            }}>

              {/* ── 1. Rank input (first) ── */}
              {rankMounted && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <label style={{
                      fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.7rem",
                      letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa",
                    }}>
                      Your 2026 TNEA Rank
                    </label>
                    {rankDataReady && (
                      <span style={{
                        padding: "2px 8px", borderRadius: 9999,
                        background: "#16a34a", color: "#fff",
                        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.58rem",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>
                        2026 Live ✓
                      </span>
                    )}
                  </div>

                  <input
                    type="number" min={1} placeholder="e.g. 12500"
                    value={rankInput}
                    onChange={(e) => { setRankInput(e.target.value); }}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid",
                      borderColor: hasValidRank && rankLookupResult ? "var(--color-teal)" : "#e0e0e0",
                      fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem",
                      color: "var(--color-ink)", outline: "none", background: "#fafafa", marginBottom: 6,
                    }}
                  />

                  {rankDataReady && rankLookupResult && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#16a34a", margin: "0 0 14px" }}>
                      ✓ Rank {parsedRank.toLocaleString("en-IN")} → cutoff <strong>{rankLookupResult.score}</strong>
                      {rankLookupResult.community && (
                        <> · community <strong>{rankLookupResult.community}</strong> auto-selected</>
                      )}
                    </p>
                  )}
                  {rankDataReady && rankInput && !rankLookupResult && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#f97316", margin: "0 0 14px" }}>
                      Rank not found in 2026 data
                    </p>
                  )}
                  {!rankDataReady && rankMounted && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "#aaa", margin: "0 0 14px" }}>
                      Loading 2026 rank data…
                    </p>
                  )}
                </>
              )}

              {/* ── 2. Cutoff score (second, auto-filled from rank) ── */}
              <label style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", display: "block", marginBottom: 8 }}>
                TNEA 2026 Cutoff Score (0 – 200)
              </label>
              <input
                type="number" min={0} max={200} step={0.5} placeholder="e.g. 187.5"
                value={cutoff}
                onChange={(e) => { setRankInput(""); setCutoff(e.target.value); }}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid",
                  borderColor: hasResult ? "var(--color-ink)" : "#e0e0e0",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem",
                  color: "var(--color-ink)", outline: "none", background: hasResult ? "#fffff8" : "#fafafa",
                  marginBottom: 20,
                  transition: "border-color 0.2s, background 0.2s",
                }}
              />

              {/* ── 3. Category ── */}
              <label style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", display: "block", marginBottom: 8 }}>
                Quota / Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setCategory(cat)} style={{
                    padding: "5px 13px", borderRadius: 9999, border: "2px solid",
                    borderColor: category === cat ? "var(--color-ink)" : "#e0e0e0",
                    background: category === cat ? "var(--color-ink)" : "#ffffff",
                    color: category === cat ? "var(--color-yellow)" : "#bbb",
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.75rem",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {hasResult && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #eee" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#888", margin: 0 }}>
                    Showing <strong style={{ color: "var(--color-ink)" }}>{category.toUpperCase()}</strong> cutoffs for score{" "}
                    <strong style={{ color: "var(--color-ink)" }}>{cutoff}</strong>
                  </p>
                </div>
              )}

              {/* ── 4. Generate button (last) ── */}
              {hasResult && (
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    marginTop: 18, padding: "13px 0", borderRadius: 14, width: "100%",
                    background: "var(--color-ink)", color: "var(--color-yellow)",
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    border: "2px solid var(--color-ink)",
                    boxShadow: "4px 4px 0 var(--color-pink)",
                    cursor: "pointer",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "6px 6px 0 var(--color-pink)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "none";
                    (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0 var(--color-pink)";
                  }}
                >
                  ✦ Generate &amp; Email Report
                  <span style={{ fontSize: "1.1rem" }}>↓</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {hasResult && results && (
        <div id="results" className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-16">

          {/* All departments open banner */}
          {allDeptsOpen && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 20px", borderRadius: 14, marginBottom: 20,
              background: "var(--color-yellow)", border: "2px solid var(--color-ink)",
              boxShadow: "3px 3px 0 var(--color-ink)",
            }}>
              <span style={{ fontSize: "1.3rem" }}>🏆</span>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.88rem", color: "var(--color-ink)", margin: "0 0 2px" }}>
                  Every single department is open to you — all {totalUniqueDepts} of them!
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "#555", margin: 0 }}>
                  With this score, no field is out of reach. Pick any college, any discipline, anywhere in Tamil Nadu.
                </p>
              </div>
            </div>
          )}

          {/* Estimated data alert */}
          {results.estimatedCount > 0 && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "14px 18px", borderRadius: 14, marginBottom: 20,
              background: "#fffbeb", border: "1.5px solid #f59e0b",
            }}>
              <span style={{ fontSize: "1.3rem", flexShrink: 0, marginTop: 1 }}>🧠</span>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.84rem", color: "#92400e", margin: "0 0 3px" }}>
                  We filled in some gaps for {category.toUpperCase()} — here&apos;s what that means for you
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "#a16207", margin: 0, lineHeight: 1.6 }}>
                  {results.estimatedCount} colleges didn&apos;t publish a separate {category.toUpperCase()} cutoff in 2025 — probably because very few or no seats were reserved under that quota. Rather than hiding those colleges from you, we peeked at their other quota cutoffs and used the lowest one as a safe estimate, so you still see the full picture. Spots marked <strong>⚠</strong> in the list below use this estimate — treat them as &quot;likely open, confirm during counselling.&quot;
                </p>
              </div>
            </div>
          )}

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Card 1: Eligible Departments */}
            <div style={{
              background: "var(--color-ink)", border: "2px solid var(--color-ink)",
              borderRadius: 16, padding: "18px 20px",
              boxShadow: "3px 3px 0 var(--color-pink)",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.2rem)", lineHeight: 1, color: allDeptsOpen ? "var(--color-yellow)" : "#ffffff" }}>
                {allDeptsOpen ? `All ${results.uniqueDepts} 🎯` : results.uniqueDepts}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 5, opacity: 0.75, color: "#ffffff" }}>
                Departments Unlocked
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.67rem", marginTop: 3, color: "#aaa" }}>
                {allDeptsOpen
                  ? "whole menu is yours bestie ✨"
                  : `${results.uniqueDepts} of ${totalUniqueDepts} disciplines open`}
              </div>
            </div>

            {/* Card 2: Eligible Colleges */}
            <div style={{
              background: "var(--color-teal)", border: "2px solid var(--color-ink)",
              borderRadius: 16, padding: "18px 20px",
              boxShadow: "3px 3px 0 var(--color-ink)",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.2rem)", lineHeight: 1, color: "var(--color-ink)" }}>
                {results.uniqueColleges.toLocaleString("en-IN")}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 5, opacity: 0.75, color: "var(--color-ink)" }}>
                Colleges Open to You
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.67rem", marginTop: 3, color: "var(--color-ink)", opacity: 0.6 }}>
                out of {totalCollegesInDataset} across Tamil Nadu
              </div>
            </div>

            {/* Card 3: % of TN colleges accessible */}
            <div style={{
              background: "#16a34a", border: "2px solid var(--color-ink)",
              borderRadius: 16, padding: "18px 20px",
              boxShadow: "3px 3px 0 var(--color-ink)",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.2rem)", lineHeight: 1, color: "#ffffff" }}>
                {Math.round((results.uniqueColleges / totalCollegesInDataset) * 100)}%
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 5, opacity: 0.75, color: "#ffffff" }}>
                of TN is yours 🌏
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.67rem", marginTop: 3, color: "#ffffff", opacity: 0.55 }}>
                of all Tamil Nadu colleges
              </div>
            </div>

            {/* Card 4: Chennai Options */}
            <div style={{
              background: "var(--color-pink)", border: "2px solid var(--color-ink)",
              borderRadius: 16, padding: "18px 20px",
              boxShadow: "3px 3px 0 var(--color-ink)",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.2rem)", lineHeight: 1, color: "var(--color-ink)" }}>
                {filteredChennaiTop.length}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 5, opacity: 0.75, color: "var(--color-ink)" }}>
                Chennai Picks 🏙️
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.67rem", marginTop: 3, color: "var(--color-ink)", opacity: 0.5 }}>
                {preferredDept ? "for your preferred dept" : `college${filteredChennaiTop.length !== 1 ? "s" : ""} you can walk into`}
              </div>
            </div>
          </div>

          {/* ── 2026 Rank Context panel ── */}
          {rankContext && (
            <div style={{
              marginBottom: 24,
              border: "2px solid var(--color-ink)",
              borderRadius: 20,
              background: "#fffff8",
              boxShadow: "4px 4px 0 var(--color-teal)",
              overflow: "hidden",
            }}>
              {/* Header bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 12,
                padding: "14px 22px",
                borderBottom: "2px solid var(--color-ink)",
                background: "var(--color-ink)",
              }}>
                <div>
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", color: "var(--color-yellow)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    📊 2026 Rank Context · Score {score}
                  </p>
                  <p style={{ margin: "3px 0 0", fontFamily: "var(--font-body)", fontSize: "0.68rem", color: "#aaa" }}>
                    Where your score stands among {rankContext.totalStudents.toLocaleString("en-IN")} students in 2026
                  </p>
                </div>
                <span style={{
                  padding: "5px 14px", borderRadius: 9999,
                  background: "var(--color-teal)", color: "#fff",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.75rem",
                }}>
                  Top {rankContext.percentile}%
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                {/* General rank block */}
                <div style={{ flex: "1 1 180px", padding: "18px 22px", borderRight: "1px solid #eee" }}>
                  <p style={{ margin: "0 0 4px", fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa" }}>
                    2026 General Rank
                  </p>
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-ink)", lineHeight: 1 }}>
                    #{rankContext.genMin.toLocaleString("en-IN")}
                    {rankContext.genMin !== rankContext.genMax && (
                      <span style={{ fontSize: "0.9rem", color: "#888" }}> – #{rankContext.genMax.toLocaleString("en-IN")}</span>
                    )}
                  </p>
                  <p style={{ margin: "5px 0 0", fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "#888" }}>
                    {rankContext.studentsAbove.toLocaleString("en-IN")} students scored higher
                  </p>
                </div>

                {/* Community rank block */}
                <div style={{ flex: "1 1 180px", padding: "18px 22px", borderRight: "1px solid #eee" }}>
                  <p style={{ margin: "0 0 4px", fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa" }}>
                    {category.toUpperCase()} Community Rank
                  </p>
                  {rankContext.community ? (
                    <>
                      <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-pink)", lineHeight: 1 }}>
                        {rankContext.community.commMin != null ? `#${rankContext.community.commMin.toLocaleString("en-IN")}` : "—"}
                        {rankContext.community.commMin != null && rankContext.community.commMax != null &&
                          rankContext.community.commMin !== rankContext.community.commMax && (
                          <span style={{ fontSize: "0.9rem", color: "#888" }}> – #{rankContext.community.commMax.toLocaleString("en-IN")}</span>
                        )}
                      </p>
                      <p style={{ margin: "5px 0 0", fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "#888" }}>
                        {rankContext.community.count} students in {category.toUpperCase()} at this score
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#aaa" }}>
                      No {category.toUpperCase()} data at this score
                    </p>
                  )}
                </div>

                {/* Competition insight block */}
                <div style={{ flex: "2 1 240px", padding: "18px 22px" }}>
                  <p style={{ margin: "0 0 4px", fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa" }}>
                    Competition at this score
                  </p>
                  <p style={{ margin: "0 0 10px", fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#333", lineHeight: 1.5 }}>
                    <strong>{rankContext.total.toLocaleString("en-IN")}</strong> students scored exactly <strong>{score}</strong> in 2026.
                    {" "}You would have been in the <strong style={{ color: "var(--color-teal)" }}>top {rankContext.percentile}%</strong> of all candidates.
                  </p>
                  {/* Rank bar */}
                  <div style={{ height: 8, borderRadius: 9999, background: "#f0f0f0", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 9999,
                      width: `${rankContext.percentile}%`,
                      background: `linear-gradient(90deg, var(--color-teal), var(--color-pink))`,
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "#aaa" }}>Rank #1</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "#aaa" }}>#{rankContext.totalStudents.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Row 2: Departments by Industry (standalone) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Departments by Industry donut */}
            <div style={{ border: "2px solid #e5e5e0", borderRadius: 20, padding: "24px", background: "#ffffff" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink)", margin: "0 0 2px" }}>
                Your Open Fields
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#bbb", margin: "0 0 16px" }}>
                Industries where your score gets you in
              </p>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                <div style={{ flexShrink: 0 }}>
                  <DonutChart segments={results.industrySegments} total={results.uniqueDepts} />
                </div>
                <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.industrySegments.map((seg) => (
                    <div key={seg.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: 1 }}>
                        <div style={{ width: 9, height: 9, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#555", wordBreak: "break-word" }}>{seg.label}</span>
                      </div>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.78rem", color: "#0a0a0a", flexShrink: 0 }}>
                        {seg.value}{" "}
                        <span style={{ color: "#bbb", fontWeight: 400, fontSize: "0.7rem" }}>
                          dept{seg.value !== 1 ? "s" : ""}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* City Distribution (moved here alongside the donut) */}
            <div style={{ border: "2px solid #e5e5e0", borderRadius: 20, padding: "24px", background: "#ffffff" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink)", margin: "0 0 2px" }}>
                Where Could You Study?
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#bbb", margin: "0 0 14px" }}>
                Your eligible colleges by city and district
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto", paddingRight: 10 }}>
                {results.cityDistribution.map((entry, i) => {
                  const maxCount = results.cityDistribution[0].count;
                  const pct = Math.round((entry.count / maxCount) * 100);
                  const isChennai = entry.city === "Chennai";
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.78rem", color: isChennai ? "var(--color-pink)" : "#0a0a0a" }}>
                          {entry.city}{isChennai && <span style={{ marginLeft: 5, fontSize: "0.6rem", color: "var(--color-pink)" }}>★</span>}
                        </span>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.78rem", color: "#555" }}>
                          {entry.count}
                        </span>
                      </div>
                      <div style={{ height: 5, borderRadius: 9999, background: "#f0f0f0", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 9999, width: `${pct}%`, background: isChennai ? "var(--color-pink)" : "var(--color-teal)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", color: "#bbb" }}>{results.cityDistribution.length} districts · {results.uniqueColleges} colleges</span>
                <button
                  onClick={() => setShowMap(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 9999,
                    border: "2px solid var(--color-ink)", background: "var(--color-ink)",
                    color: "var(--color-yellow)",
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.72rem",
                    cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em",
                  }}
                >
                  🗺 View on Map
                </button>
              </div>
            </div>
          </div>

          {/* ── Department filter — bold checkpoint ── */}
          <style>{`
            @keyframes dept-card-pulse {
              0%,100% { box-shadow: 6px 6px 0 var(--color-ink); }
              50%      { box-shadow: 8px 8px 0 var(--color-ink), 0 0 0 6px rgba(237,230,23,0.35); }
            }
            @keyframes dept-cta-bounce {
              0%,100% { transform: translateY(0px); }
              40%      { transform: translateY(-4px); }
              60%      { transform: translateY(-2px); }
            }
            @keyframes dept-arrow-slide {
              0%,100% { transform: translateX(0); }
              50%      { transform: translateX(5px); }
            }
          `}</style>

          <div style={{
            border: "2px solid var(--color-ink)",
            borderRadius: 20,
            background: "var(--color-yellow)",
            marginBottom: 24,
            overflow: "hidden",
            animation: !preferredDept && !deptPickerOpen ? "dept-card-pulse 2.4s ease-in-out infinite" : "none",
            boxShadow: preferredDept ? "6px 6px 0 var(--color-teal)" : "6px 6px 0 var(--color-ink)",
            transition: "box-shadow 0.3s ease, background 0.3s ease",
          }}>
            {/* Main prompt */}
            <div style={{ padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Heading */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <span style={{ fontSize: "2.2rem", flexShrink: 0, lineHeight: 1 }}>🎯</span>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-display)", fontWeight: 700,
                    fontSize: "clamp(1.3rem,3vw,1.9rem)", textTransform: "uppercase",
                    letterSpacing: "-0.01em", color: "var(--color-ink)",
                    margin: "0 0 6px", lineHeight: 1.05,
                  }}>
                    Already know what you want to study?
                  </h3>
                  <p style={{
                    fontFamily: "var(--font-body)", fontSize: "0.88rem",
                    color: "var(--color-ink)", opacity: 0.65, margin: 0, lineHeight: 1.5,
                  }}>
                    Pick your department and we&apos;ll filter your entire shortlist to only colleges that offer it — so you see exactly what matters to you.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              {!deptPickerOpen && !preferredDept && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setPreferredDept(null); setDeptPickerOpen(false); }}
                    style={{
                      padding: "12px 24px", borderRadius: 9999,
                      border: "2px solid var(--color-ink)",
                      background: "rgba(255,255,255,0.5)",
                      color: "var(--color-ink)",
                      fontFamily: "var(--font-display)", fontWeight: 700,
                      fontSize: "0.88rem", textTransform: "uppercase",
                      letterSpacing: "0.04em", cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    No, show me everything
                  </button>
                  <button
                    onClick={() => setDeptPickerOpen(true)}
                    style={{
                      padding: "12px 28px", borderRadius: 9999,
                      border: "2px solid var(--color-ink)",
                      background: "var(--color-ink)",
                      color: "var(--color-yellow)",
                      fontFamily: "var(--font-display)", fontWeight: 700,
                      fontSize: "0.88rem", textTransform: "uppercase",
                      letterSpacing: "0.04em", cursor: "pointer",
                      boxShadow: "3px 3px 0 rgba(0,0,0,0.25)",
                      animation: "dept-cta-bounce 2s ease-in-out infinite",
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    Yes, I have a department in mind
                    <span style={{ display: "inline-block", animation: "dept-arrow-slide 1.4s ease-in-out infinite" }}>→</span>
                  </button>
                </div>
              )}
            </div>

            {/* Expanded picker */}
            {(deptPickerOpen || preferredDept) && (
              <div style={{
                borderTop: "2px solid var(--color-ink)",
                padding: "22px 28px",
                background: "#ffffff",
                display: "flex", flexDirection: "column", gap: 16,
              }}>

                {/* Dropdown row */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <label style={{
                      fontFamily: "var(--font-display)", fontWeight: 700,
                      fontSize: "0.65rem", letterSpacing: "0.1em",
                      textTransform: "uppercase", color: "#aaa",
                      display: "block", marginBottom: 8,
                    }}>
                      Select your department
                    </label>
                    <select
                      value={preferredDept ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPreferredDept(val || null);
                        if (val) { setChennaiVisible(6); setTnVisible(6); }
                      }}
                      style={{
                        width: "100%", padding: "13px 16px", borderRadius: 12,
                        border: "2px solid",
                        borderColor: preferredDept ? "var(--color-ink)" : "#e0e0e0",
                        fontFamily: "var(--font-body)", fontWeight: preferredDept ? 700 : 400,
                        fontSize: "0.9rem",
                        color: preferredDept ? "var(--color-ink)" : "#999",
                        background: preferredDept ? "#fffff8" : "#fafafa",
                        outline: "none", cursor: "pointer",
                        boxShadow: preferredDept ? "3px 3px 0 var(--color-ink)" : "none",
                        transition: "all 0.2s",
                      }}
                    >
                      <option value="">— choose a department —</option>
                      {deptOptions.map((d) => (
                        <option key={d.dept} value={d.dept}>
                          {d.dept}  ·  {d.collegeCount} college{d.collegeCount !== 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset */}
                  <button
                    onClick={() => { setPreferredDept(null); setDeptPickerOpen(false); setChennaiVisible(6); setTnVisible(6); }}
                    style={{
                      padding: "13px 20px", borderRadius: 12,
                      border: "2px solid var(--color-ink)",
                      background: "var(--color-ink)", color: "var(--color-yellow)",
                      fontFamily: "var(--font-display)", fontWeight: 700,
                      fontSize: "0.8rem", textTransform: "uppercase",
                      letterSpacing: "0.05em", cursor: "pointer",
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}
                  >
                    ✕ Reset
                  </button>
                </div>

                {/* Active filter result callout */}
                {preferredDept && (
                  <div style={{
                    padding: "14px 18px", borderRadius: 12,
                    background: filteredTnTop.length > 0 ? "#f0fdf4" : "#fff0f0",
                    border: `2px solid ${filteredTnTop.length > 0 ? "#16a34a" : "var(--color-pink)"}`,
                    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                  }}>
                    <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>
                      {filteredTnTop.length > 0 ? "✅" : "❌"}
                    </span>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#0a0a0a", margin: 0, flex: 1 }}>
                      {filteredTnTop.length > 0 ? (
                        <>
                          Your shortlists now show only colleges offering{" "}
                          <strong>{preferredDept.length > 40 ? preferredDept.slice(0, 38) + "…" : preferredDept}</strong>.
                          {" "}<span style={{ color: "#16a34a", fontWeight: 700 }}>{filteredChennaiTop.length} in Chennai</span>
                          {" "}·{" "}
                          <span style={{ color: "#0284c7", fontWeight: 700 }}>{filteredTnTop.length} across TN</span>
                          {" "}within your <strong>{category.toUpperCase()}</strong> score.
                        </>
                      ) : (
                        <>
                          No colleges offer <strong>{preferredDept}</strong> within your{" "}
                          <strong>{category.toUpperCase()}</strong> cutoff of <strong>{cutoff}</strong>.
                          Try a different department or raise your score.
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Row 3: Chennai + TN colleges (full width each, side by side) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Top Chennai Colleges */}
            <div style={{ border: "2px solid #e5e5e0", borderRadius: 20, padding: "24px", background: "#ffffff" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink)", margin: "0 0 2px" }}>
                Your Chennai Shortlist
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#bbb", margin: "0 0 14px" }}>
                {preferredDept
                  ? `Colleges with ${preferredDept.length > 28 ? preferredDept.slice(0, 26) + "…" : preferredDept} in Chennai`
                  : `Best colleges you can get in Chennai · ${category.toUpperCase()} quota`}
              </p>
              {filteredChennaiTop.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 32 }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>{preferredDept ? "🔍" : "🏙️"}</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#bbb" }}>
                    {preferredDept
                      ? `No Chennai colleges offer this department within your ${category.toUpperCase()} score.`
                      : `No Chennai colleges for this cutoff in ${category.toUpperCase()} quota.`}
                  </p>
                  {preferredDept && (
                    <button onClick={() => { setPreferredDept(null); setDeptPickerOpen(false); }} style={{ marginTop: 10, padding: "6px 16px", borderRadius: 9999, border: "1.5px solid #e0e0e0", background: "#fff", fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#888", cursor: "pointer" }}>
                      Remove dept filter
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filteredChennaiTop.slice(0, chennaiVisible).map((college, i) => (
                      <CollegeCard key={college.code} college={college} rank={i} accent="yellow" />
                    ))}
                  </div>
                  {chennaiVisible < filteredChennaiTop.length && (
                    <ShowMoreBtn remaining={filteredChennaiTop.length - chennaiVisible} onClick={() => setChennaiVisible((v) => v + 6)} />
                  )}
                  {chennaiVisible >= filteredChennaiTop.length && filteredChennaiTop.length > 6 && (
                    <p style={{ textAlign: "center", marginTop: 10, fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#ccc" }}>
                      All {filteredChennaiTop.length} colleges shown
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Top TN Colleges */}
            <div style={{ border: "2px solid #e5e5e0", borderRadius: 20, padding: "24px", background: "#ffffff" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink)", margin: "0 0 2px" }}>
                Your TN Shortlist
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#bbb", margin: "0 0 14px" }}>
                {preferredDept
                  ? `Colleges with ${preferredDept.length > 28 ? preferredDept.slice(0, 26) + "…" : preferredDept} statewide`
                  : `Best colleges you can reach statewide · ${category.toUpperCase()} quota`}
              </p>
              {filteredTnTop.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 32 }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔍</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#bbb" }}>
                    No colleges statewide offer this department within your {category.toUpperCase()} score.
                  </p>
                  <button onClick={() => { setPreferredDept(null); setDeptPickerOpen(false); }} style={{ marginTop: 10, padding: "6px 16px", borderRadius: 9999, border: "1.5px solid #e0e0e0", background: "#fff", fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#888", cursor: "pointer" }}>
                    Remove dept filter
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filteredTnTop.slice(0, tnVisible).map((college, i) => (
                      <CollegeCard key={college.code} college={college} rank={i} accent="pink" />
                    ))}
                  </div>
                  {tnVisible < filteredTnTop.length && (
                    <ShowMoreBtn remaining={filteredTnTop.length - tnVisible} onClick={() => setTnVisible((v) => v + 6)} />
                  )}
                  {tnVisible >= filteredTnTop.length && filteredTnTop.length > 6 && (
                    <p style={{ textAlign: "center", marginTop: 10, fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#ccc" }}>
                      All {filteredTnTop.length} colleges shown
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Row 4: Department Table (full width reference) ── */}
          <div className="mb-8">
            <div style={{ border: "2px solid #e5e5e0", borderRadius: 20, padding: "24px", background: "#ffffff" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink)", margin: "0 0 2px" }}>
                Departments You Can Enroll In
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#bbb", margin: "0 0 14px" }}>
                {results.uniqueDepts} department{results.uniqueDepts !== 1 ? "s" : ""} with your {category.toUpperCase()} quota score · most competitive first
              </p>

              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 64px 54px", gap: 4, padding: "5px 12px 8px", borderBottom: "2px solid #f0f0f0" }}>
                {["Department", "Min Cutoff", "Max Cutoff", "Colleges"].map((h) => (
                  <span key={h} style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#bbb", textAlign: h !== "Department" ? "right" : "left" }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Scrollable rows */}
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {results.deptTable.map((row, i) => {
                  const group = classifyDept(row.dept);
                  return (
                    <div key={i} style={{
                      display: "grid", gridTemplateColumns: "1fr 64px 64px 54px",
                      gap: 4, padding: "8px 12px",
                      background: i % 2 === 0 ? "#fafaf8" : "#ffffff",
                      borderRadius: 6,
                    }}>
                      <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: group.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.75rem", color: "#0a0a0a", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.35 }}>
                          {row.dept}
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.75rem", color: "#16a34a", textAlign: "right" }}>
                        {row.minCutoff}
                      </span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.75rem", color: "var(--color-teal)", textAlign: "right" }}>
                        {row.maxCutoff}
                      </span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.75rem", color: "#555", textAlign: "right" }}>
                        {row.collegeCount}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#f8f8f6", fontFamily: "var(--font-body)", fontSize: "0.68rem", color: "#aaa" }}>
                Min = lowest cutoff in that dept (easiest college) · Max = highest cutoff (most competitive college) · all figures are {category.toUpperCase()} quota
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl" style={{
            background: "var(--color-ink)", border: "2px solid var(--color-ink)",
            boxShadow: "4px 4px 0 var(--color-pink)",
          }}>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1rem,2.5vw,1.3rem)", color: "var(--color-yellow)", margin: 0, lineHeight: 1.3 }}>
                {results.uniqueColleges} colleges are waiting for you. Browse every one.
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#666", margin: "4px 0 0" }}>
                Search by name, filter by quota, explore by department — your next step is down there.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              <EmailReportButton sourcePage="results" variant="secondary" label="✉ Email Report" />
              <a href="#explore" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 9999,
                background: "var(--color-yellow)", color: "var(--color-ink)",
                fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.9rem",
                textDecoration: "none",
              }}>
                Browse All Eligible ↓
              </a>
            </div>
          </div>
        </div>
      )}

      <EmailReportModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        sourcePage="hero"
      />

      {/* ── Empty state ── */}
      {!hasResult && (
        <div className="max-w-lg mx-auto text-center px-6 py-16 lg:py-24">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: "var(--color-yellow)", border: "2px solid var(--color-ink)" }}>
            <span style={{ fontSize: "1.6rem" }}>🎯</span>
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Your journey starts here
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#aaa", marginTop: 8, lineHeight: 1.6 }}>
            Enter your cutoff and quota above — we&apos;ll instantly show every college open to you, which departments you can study, and where across Tamil Nadu you could land.
          </p>
        </div>
      )}

      {/* ── Map modal ── */}
      {showMap && results && (
        <Suspense fallback={null}>
          <CollegeMap
            entries={mapEntries}
            onClose={() => setShowMap(false)}
            totalColleges={results.uniqueColleges}
            quota={CATEGORY_LABELS[category]}
            score={score}
          />
        </Suspense>
      )}
    </section>
  );
}
