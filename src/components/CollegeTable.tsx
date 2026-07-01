"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Building2,
  BookOpen,
  MapPin,
  X,
} from "lucide-react";
// ChevronDown / ChevronRight kept for DeptAccordion
import type { CollegeRow, CategoryKey } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import EmailReportButton from "./EmailReportButton";

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES: CategoryKey[] = ["oc", "bc", "bcm", "mbc", "sc", "sca", "st"];

const CITY_KEYWORDS: [string, string][] = [
  ["Chennai", "Chennai"],
  ["Guindy", "Chennai"],
  ["Chrompet", "Chennai"],
  ["Tambaram", "Chennai"],
  ["Coimbatore", "Coimbatore"],
  ["Thadagam", "Coimbatore"],
  ["Vellore", "Vellore"],
  ["Bagayam", "Vellore"],
  ["Madurai", "Madurai"],
  ["Trichy", "Trichy"],
  ["Tiruchirappalli", "Trichy"],
  ["Salem", "Salem"],
  ["Thanjavur", "Thanjavur"],
  ["Tirunelveli", "Tirunelveli"],
  ["Erode", "Erode"],
  ["Tirupur", "Tirupur"],
  ["Puducherry", "Puducherry"],
  ["Chengalpattu", "Chengalpattu"],
  ["Kanchipuram", "Kanchipuram"],
];

function extractCity(name: string): string {
  for (const [kw, city] of CITY_KEYWORDS) {
    if (name.toLowerCase().includes(kw.toLowerCase())) return city;
  }
  const m = name.match(/(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+District/);
  if (m) return m[1];
  return "Tamil Nadu";
}

// ── Flexible search ───────────────────────────────────────────────────────────
// College names in the CSV include the full address after the first comma,
// e.g. "S.K.P. Engineering College, Chinnkangiyanur, Somasipadi Post, ..."
// For initials/subsequence we only use the primary name (before the first comma)
// to prevent address tokens ("Panapakkam", "Kattalai" etc.) from creating
// spurious acronym hits.

function primaryName(fullText: string): string {
  return fullText.split(",")[0].trim().toLowerCase();
}

function getInitials(name: string): string {
  return name
    .split(/[\s.,\-/()\[\]]+/)
    .filter(Boolean)
    .map((tok) => tok[0])
    .join("");
}

// Returns a relevance score (higher = better match):
//   5 – initials start with query   ("skpec".startsWith("skp") for S.K.P)
//   4 – direct substring in name
//   3 – initials contain query
//   2 – subsequence match in initials (≥3 chars only)
//   1 – match only in address / branch / city
//   0 – no match
function matchScore(text: string, q: string): number {
  if (!q) return 5;
  const t = text.toLowerCase();
  const pn = primaryName(t);
  const initials = getInitials(pn);

  if (initials.startsWith(q)) return 5;
  if (pn.includes(q) || t.includes(q)) return 4;
  if (initials.includes(q)) return 3;

  if (q.length >= 3) {
    let qi = 0;
    for (let i = 0; i < initials.length && qi < q.length; i++) {
      if (initials[i] === q[qi]) qi++;
    }
    if (qi === q.length) return 2;
  }

  return 0;
}

function flexMatch(text: string, q: string): boolean {
  return matchScore(text, q) > 0;
}

function parseScore(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function scoreColor(val: string): string {
  const n = parseScore(val);
  if (n === null) return "#aaa";
  if (n >= 196) return "#16a34a";
  if (n >= 188) return "#0891b2";
  if (n >= 175) return "#b45309";
  if (n >= 155) return "#dc2626";
  return "#7c3aed";
}

function ScorePill({ val }: { val: string }) {
  if (!val || val === "—")
    return <span style={{ color: "#ccc", fontSize: "0.8rem" }}>—</span>;
  return (
    <span
      style={{
        display: "inline-block",
        minWidth: 48,
        textAlign: "center",
        padding: "2px 10px",
        borderRadius: 9999,
        fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "0.82rem",
        background: `${scoreColor(val)}18`,
        color: scoreColor(val),
        border: `1.5px solid ${scoreColor(val)}40`,
      }}
    >
      {val}
    </span>
  );
}

// ── Group helpers ─────────────────────────────────────────────────────────────

type CollegeGroup = {
  code: string;
  name: string;
  city: string;
  branches: CollegeRow[];
};

type DeptGroup = {
  branch: string;
  total: number;
  cities: { city: string; rows: CollegeRow[] }[];
};

function groupByCollege(rows: CollegeRow[]): CollegeGroup[] {
  const map = new Map<string, CollegeGroup>();
  for (const row of rows) {
    if (!map.has(row.code)) {
      map.set(row.code, {
        code: row.code,
        name: row.collegeName,
        city: extractCity(row.collegeName),
        branches: [],
      });
    }
    map.get(row.code)!.branches.push(row);
  }
  return [...map.values()].sort(
    (a, b) => parseInt(a.code) - parseInt(b.code)
  );
}

function groupByDept(rows: CollegeRow[]): DeptGroup[] {
  const map = new Map<string, Map<string, CollegeRow[]>>();
  for (const row of rows) {
    if (!map.has(row.branch)) map.set(row.branch, new Map());
    const city = extractCity(row.collegeName);
    const cityMap = map.get(row.branch)!;
    if (!cityMap.has(city)) cityMap.set(city, []);
    cityMap.get(city)!.push(row);
  }
  return [...map.entries()]
    .map(([branch, cityMap]) => ({
      branch,
      total: [...cityMap.values()].reduce((s, arr) => s + arr.length, 0),
      cities: [...cityMap.entries()]
        .map(([city, rows]) => ({ city, rows }))
        .sort((a, b) => a.city.localeCompare(b.city)),
    }))
    .sort((a, b) => a.branch.localeCompare(b.branch));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryTabs({
  active,
  onChange,
}: {
  active: CategoryKey;
  onChange: (c: CategoryKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span
        style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        color: "#aaa",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontFamily: "var(--font-body)",
        whiteSpace: "nowrap",
        }}
      >
        Quota:
      </span>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          style={{
            padding: "4px 14px",
            borderRadius: 9999,
            border: "2px solid",
            borderColor: active === cat ? "var(--color-yellow)" : "#ddd",
            background:
              active === cat ? "var(--color-yellow)" : "#f0f0f0",
            color: active === cat ? "var(--color-ink)" : "#999",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "0.75rem",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  );
}

// ── City accent colours ───────────────────────────────────────────────────────

const CITY_ACCENTS: Record<string, string> = {
  "Chennai":      "var(--color-pink)",
  "Coimbatore":   "var(--color-teal)",
  "Vellore":      "#a78bfa",
  "Madurai":      "#f97316",
  "Trichy":       "#818cf8",
  "Salem":        "#34d399",
  "Thanjavur":    "#c084fc",
  "Tirunelveli":  "#fb923c",
  "Erode":        "#facc15",
  "Tirupur":      "#38bdf8",
  "Puducherry":   "#f472b6",
  "Kanchipuram":  "#4ade80",
  "Chengalpattu": "#e879f9",
};
function cityAccent(city: string): string {
  return CITY_ACCENTS[city] ?? "var(--color-yellow)";
}

// ── Individual college card ───────────────────────────────────────────────────

function CollegeCardItem({
  college, activeCategory, isSelected, onClick,
}: {
  college: CollegeGroup;
  activeCategory: CategoryKey;
  isSelected: boolean;
  onClick: () => void;
}) {
  const accent = cityAccent(college.city);
  const shortName = college.name.split(",")[0].trim();
  const scores = college.branches
    .map((r) => parseScore(r[activeCategory]))
    .filter((n): n is number => n !== null);
  const min = scores.length ? Math.min(...scores) : null;
  const max = scores.length ? Math.max(...scores) : null;

  return (
    <div
      onClick={onClick}
      style={{
        border: "2px solid var(--color-ink)",
        borderRadius: 16,
        background: isSelected ? "#fffff5" : "#ffffff",
        boxShadow: isSelected ? `5px 5px 0 ${accent}` : "3px 3px 0 var(--color-ink)",
        cursor: "pointer",
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        transform: isSelected ? "translate(-2px, -2px)" : "none",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* City colour bar */}
      <div style={{ height: 6, background: accent }} />

      <div style={{ padding: "14px 16px" }}>
        {/* Code + city + depts */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
          <span style={{
            padding: "2px 9px", borderRadius: 9999,
            background: "var(--color-ink)", color: "var(--color-yellow)",
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.62rem",
            flexShrink: 0,
          }}>
            CODE {college.code}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: "var(--font-body)", fontSize: "0.68rem", color: "#aaa" }}>
            <MapPin size={10} /> {college.city}
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "#ccc" }}>
            · {college.branches.length} dept{college.branches.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* College short name */}
        <p style={{
          margin: "0 0 13px",
          fontFamily: "var(--font-body)", fontWeight: 600,
          fontSize: "0.88rem", color: isSelected ? "#0a0a0a" : "#333",
          lineHeight: 1.45,
        }}>
          {shortName}
        </p>

        {/* Footer: quota label + score range */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            padding: "3px 10px", borderRadius: 9999,
            background: accent + "22", color: "#555",
            border: `1.5px solid ${accent}55`,
            fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {CATEGORY_LABELS[activeCategory]}
          </span>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "0.88rem", color: "var(--color-teal)",
          }}>
            {min !== null ? `${min} – ${max}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Branch detail drawer (appears below the grid) ─────────────────────────────

function BranchDrawer({
  college, activeCategory, onClose,
}: {
  college: CollegeGroup;
  activeCategory: CategoryKey;
  onClose: () => void;
}) {
  const accent = cityAccent(college.city);
  const shortName = college.name.split(",")[0].trim();

  return (
    <div style={{
      marginTop: 4, marginBottom: 8,
      border: "2px solid var(--color-ink)",
      borderRadius: 20, overflow: "hidden",
      boxShadow: `5px 5px 0 ${accent}`,
      background: "#fffff8",
    }}>
      {/* Accent bar */}
      <div style={{ height: 6, background: accent }} />

      {/* Header */}
      <div style={{
        padding: "18px 22px",
        borderBottom: "2px solid #eee",
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{
              padding: "2px 10px", borderRadius: 9999,
              background: "var(--color-ink)", color: "var(--color-yellow)",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.65rem",
            }}>
              CODE {college.code}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#aaa" }}>
              📍 {college.city}
            </span>
          </div>
          <p style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "1.05rem", textTransform: "uppercase",
            letterSpacing: "0.02em", color: "var(--color-ink)", margin: 0,
          }}>
            {shortName}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "#aaa", margin: "4px 0 0" }}>
            {college.branches.length} departments · {CATEGORY_LABELS[activeCategory]} cutoffs
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: "7px 16px", borderRadius: 9999, flexShrink: 0,
            border: "2px solid var(--color-ink)", background: "var(--color-ink)",
            color: "var(--color-yellow)", cursor: "pointer",
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em",
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 110px",
        padding: "9px 22px", background: "#f5f5f0",
        borderBottom: "1.5px solid #e5e5e0",
      }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.1em", color: "#aaa", textTransform: "uppercase" }}>
          Department
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--color-pink)", textTransform: "uppercase", textAlign: "right" }}>
          {CATEGORY_LABELS[activeCategory]} Cutoff
        </span>
      </div>

      {/* Branch rows */}
      {college.branches.map((row, i) => (
        <div
          key={`${row.code}-${row.branch}-${i}`}
          style={{
            display: "grid", gridTemplateColumns: "1fr 110px",
            padding: "13px 22px", alignItems: "start",
            borderBottom: "1px solid #eee",
            background: i % 2 === 0 ? "#fffff8" : "#ffffff",
          }}
        >
          <p style={{
            margin: 0, paddingRight: 16,
            fontFamily: "var(--font-body)", fontWeight: 500,
            fontSize: "0.87rem", color: "#333", lineHeight: 1.45,
          }}>
            {row.branch}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <ScorePill val={row[activeCategory]} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Pinterest card grid ───────────────────────────────────────────────────────

function CollegeGrid({
  colleges,
  activeCategory,
}: {
  colleges: CollegeGroup[];
  activeCategory: CategoryKey;
}) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const toggle = useCallback((code: string) => {
    setSelectedCode((prev) => (prev === code ? null : code));
  }, []);

  const selectedCollege = colleges.find((c) => c.code === selectedCode) ?? null;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
      {/* Card grid — 4 columns, horizontal (row-first) order */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {colleges.map((college) => (
          <CollegeCardItem
            key={college.code}
            college={college}
            activeCategory={activeCategory}
            isSelected={selectedCode === college.code}
            onClick={() => toggle(college.code)}
          />
        ))}
      </div>

      {/* Branch drawer — rendered below the whole grid */}
      {selectedCollege && (
        <BranchDrawer
          college={selectedCollege}
          activeCategory={activeCategory}
          onClose={() => setSelectedCode(null)}
        />
      )}
    </div>
  );
}

// ── View 2: By Department ─────────────────────────────────────────────────────

function DeptAccordion({
  depts,
  activeCategory,
}: {
  depts: DeptGroup[];
  activeCategory: CategoryKey;
}) {
  const [openDepts, setOpenDepts] = useState<Set<string>>(new Set());
  const [openCities, setOpenCities] = useState<Set<string>>(new Set());

  const toggleDept = useCallback((branch: string) => {
    setOpenDepts((prev) => {
      const n = new Set(prev);
      n.has(branch) ? n.delete(branch) : n.add(branch);
      return n;
    });
  }, []);

  const toggleCity = useCallback((key: string) => {
    setOpenCities((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }, []);

  return (
    <div>
      {depts.map((dept, di) => {
        const deptOpen = openDepts.has(dept.branch);
        return (
          <div key={dept.branch} style={{ borderBottom: "1px solid #ebebeb" }}>
            {/* Department header */}
            <button
              onClick={() => toggleDept(dept.branch)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "18px 24px",
                background: deptOpen ? "#fffef5" : di % 2 === 0 ? "#fafaf8" : "#ffffff",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ color: deptOpen ? "var(--color-pink)" : "#ccc", marginTop: 3, flexShrink: 0 }}>
                {deptOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: 9999,
                      background: "var(--color-pink)",
                      color: "var(--color-ink)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      flexShrink: 0,
                    }}
                  >
                    {dept.total} {dept.total === 1 ? "college" : "colleges"}
                  </span>
                  <span style={{ color: "#bbb", fontSize: "0.75rem", fontFamily: "var(--font-body)" }}>
                    {dept.cities.length} {dept.cities.length === 1 ? "city" : "cities"}
                  </span>
                </div>

                {/* Full branch name — no trim */}
                <p
                  style={{
                    margin: 0,
                    color: deptOpen ? "#0a0a0a" : "#444",
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    lineHeight: 1.4,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                >
                  {dept.branch}
                </p>
              </div>
            </button>

            {/* Cities */}
            {deptOpen && (
              <div style={{ background: "#f8f8f6" }}>
                {dept.cities.map((cityGroup, ci) => {
                  const cityKey = `${dept.branch}||${cityGroup.city}`;
                  const cityOpen = openCities.has(cityKey);

                  return (
                    <div key={cityKey} style={{ borderTop: "1px solid #e5e5e0" }}>
                      {/* City header */}
                      <button
                        onClick={() => toggleCity(cityKey)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "13px 24px 13px 46px",
                          background: cityOpen ? "#fffef0" : "#f8f8f6",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ color: cityOpen ? "var(--color-teal)" : "#ccc", flexShrink: 0 }}>
                          {cityOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </span>
                        <MapPin size={13} style={{ color: cityOpen ? "var(--color-teal)" : "#ccc", flexShrink: 0 }} />
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: cityOpen ? "var(--color-teal)" : "#aaa",
                          }}
                        >
                          {cityGroup.city}
                        </span>
                        <span
                          style={{
                            marginLeft: "auto",
                            fontFamily: "var(--font-body)",
                            fontSize: "0.72rem",
                            color: "#bbb",
                          }}
                        >
                          {cityGroup.rows.length} {cityGroup.rows.length === 1 ? "college" : "colleges"}
                        </span>
                      </button>

                      {/* Colleges in city */}
                      {cityOpen && (
                        <div style={{ background: "#f5f5f3" }}>
                          {/* Header */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 130px",
                              gap: 12,
                              padding: "9px 24px 9px 70px",
                              borderTop: "1px solid #e0e0da",
                              background: "#eeeeea",
                            }}
                          >
                            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.1em", color: "#aaa", textTransform: "uppercase" }}>
                              College Name
                            </span>
                            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.1em", color: "var(--color-pink)", textTransform: "uppercase", textAlign: "right" }}>
                              {CATEGORY_LABELS[activeCategory]}
                            </span>
                          </div>

                          {cityGroup.rows.map((row, ri) => (
                            <div
                              key={`${row.code}-${ri}`}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 130px",
                                gap: 12,
                                padding: "13px 24px 13px 70px",
                                borderTop: "1px solid #e8e8e3",
                                background: ri % 2 === 0 ? "#f5f5f3" : "#fafaf8",
                                alignItems: "start",
                              }}
                            >
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                  <span
                                    style={{
                                      padding: "1px 7px",
                                      borderRadius: 9999,
                                      border: "1.5px solid #ddd",
                                      color: "#aaa",
                                      fontFamily: "var(--font-display)",
                                      fontWeight: 700,
                                      fontSize: "0.62rem",
                                    }}
                                  >
                                    {row.code}
                                  </span>
                                </div>
                                {/* Full college name — no trim */}
                                <p
                                  style={{
                                    margin: 0,
                                    color: "#333",
                                    fontFamily: "var(--font-body)",
                                    fontWeight: 500,
                                    fontSize: "0.83rem",
                                    lineHeight: 1.45,
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {row.collegeName}
                                </p>
                              </div>
                              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 20 }}>
                                <ScorePill val={row[activeCategory]} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function normaliseBranch(b: string): string {
  return b
    .replace(/\s*\(SS\)\s*$/i, "")
    .replace(/\s*\(TAMIL MEDIUM\)\s*$/i, "")
    .trim()
    .toUpperCase();
}

export default function CollegeTable({ data }: { data: CollegeRow[] }) {
  const [view, setView] = useState<"college" | "dept">("college");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("oc");

  const q = search.toLowerCase().trim();

  const uniqueColleges = useMemo(() => new Set(data.map((r) => r.code)).size, [data]);
  const uniqueDepts = useMemo(() => new Set(data.map((r) => normaliseBranch(r.branch))).size, [data]);

  // --- Filtered groups for View 1 ---
  const collegeGroups = useMemo(() => {
    const groups = groupByCollege(data);
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        branches: g.branches.filter(
          (r) =>
            flexMatch(r.branch, q) ||
            flexMatch(g.name, q) ||
            g.code.includes(q) ||
            g.city.toLowerCase().includes(q)
        ),
      }))
      .filter(
        (g) =>
          g.branches.length > 0 ||
          flexMatch(g.name, q) ||
          g.code.includes(q) ||
          g.city.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const sa = matchScore(a.name, q);
        const sb = matchScore(b.name, q);
        if (sb !== sa) return sb - sa;
        return parseInt(a.code) - parseInt(b.code);
      });
  }, [data, q]);

  // --- Filtered groups for View 2 ---
  const deptGroups = useMemo(() => {
    const groups = groupByDept(data);
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        cities: g.cities
          .map((c) => ({
            ...c,
            rows: c.rows.filter(
              (r) =>
                flexMatch(r.branch, q) ||
                flexMatch(r.collegeName, q) ||
                r.code.includes(q) ||
                c.city.toLowerCase().includes(q)
            ),
          }))
          .filter((c) => c.rows.length > 0),
      }))
      .filter(
        (g) =>
          g.cities.length > 0 || flexMatch(g.branch, q)
      )
      .map((g) => ({ ...g, total: g.cities.reduce((s, c) => s + c.rows.length, 0) }))
      .sort((a, b) => {
        const sa = matchScore(a.branch, q);
        const sb = matchScore(b.branch, q);
        if (sb !== sa) return sb - sa;
        return a.branch.localeCompare(b.branch);
      });
  }, [data, q]);

  return (
    <section id="explore" style={{ background: "#ffffff" }}>

      {/* ── Section header ── */}
      <div style={{ borderBottom: "2px solid #e5e5e0" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20">
          <span
            className="section-num mb-6 inline-block"
            style={{ color: "var(--color-ink)", borderColor: "var(--color-ink)" }}
          >
            04
          </span>
          <h2
            className="leading-[0.88] tracking-tighter uppercase"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "clamp(3rem,8vw,7rem)",
              color: "var(--color-ink)",
            }}
          >
            Your college
            <br />
            <span style={{ color: "var(--color-pink)" }}>is in here.</span>
          </h2>
          <p
            className="mt-5 max-w-xl"
            style={{ fontFamily: "var(--font-body)", color: "#666", fontSize: "1.05rem", lineHeight: 1.6 }}
          >
            <strong>{uniqueColleges}</strong> colleges · <strong>{uniqueDepts}</strong> departments · every TNEA 2025 cutoff.
            Search by name, filter by quota, or drill down by department — one of these is yours.
          </p>
          <div className="mt-6">
            <EmailReportButton sourcePage="explore" variant="secondary" />
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div
        className="sticky top-0 z-30"
        style={{ background: "#ffffff", borderBottom: "2px solid #e5e5e0" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex flex-col gap-4">

          {/* Row 1: View toggle + Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

            {/* View toggle */}
            <div
              className="flex rounded-full p-1 flex-shrink-0"
              style={{ background: "#f0f0f0", border: "1.5px solid #ddd" }}
            >
              <button
                onClick={() => { setView("college"); setSearch(""); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 16px",
                  borderRadius: 9999,
                  border: "none",
                  background: view === "college" ? "var(--color-yellow)" : "transparent",
                  color: view === "college" ? "var(--color-ink)" : "#888",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                <Building2 size={13} />
                By College
              </button>
              <button
                onClick={() => { setView("dept"); setSearch(""); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 16px",
                  borderRadius: 9999,
                  border: "none",
                  background: view === "dept" ? "var(--color-pink)" : "transparent",
                  color: view === "dept" ? "var(--color-ink)" : "#888",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                <BookOpen size={13} />
                By Department
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 w-full" style={{ maxWidth: 480 }}>
              <Search
                size={15}
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#bbb" }}
              />
              <input
                type="text"
                placeholder={
                  view === "college"
                    ? "Search college name, code, or city…"
                    : "Search department / branch name…"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: 38,
                  paddingRight: search ? 36 : 14,
                  paddingTop: 9,
                  paddingBottom: 9,
                  borderRadius: 9999,
                  border: "2px solid",
                  borderColor: search ? "var(--color-pink)" : "#ddd",
                  background: "#f5f5f5",
                  color: "#0a0a0a",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb", background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Count badge */}
            <span style={{ fontSize: "0.75rem", color: "#aaa", fontFamily: "var(--font-body)", whiteSpace: "nowrap", marginLeft: "auto" }}>
              {view === "college"
                ? `${collegeGroups.length} college${collegeGroups.length !== 1 ? "s" : ""}`
                : `${deptGroups.length} branch${deptGroups.length !== 1 ? "es" : ""}`}
            </span>
          </div>

          {/* Row 2: Category tabs */}
          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
        </div>
      </div>

      {/* ── Content ── */}
      {view === "college" ? (
        <CollegeGrid colleges={collegeGroups} activeCategory={activeCategory} />
      ) : (
        <DeptAccordion depts={deptGroups} activeCategory={activeCategory} />
      )}
    </section>
  );
}
