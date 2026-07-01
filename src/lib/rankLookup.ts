/**
 * rankLookup.ts — TNEA 2026 rank data.
 * Primary source: /data/rank2026.json (bundled in public/, auto-loaded at startup).
 * Override: admin-uploaded CSV saved to localStorage (takes precedence if present).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type CommunityKey = "OC" | "BC" | "BCM" | "MBC" | "SC" | "SCA" | "ST";

type CommunityEntry = {
  count: number;
  genMin: number;
  genMax: number;
  commMin: number | null;
  commMax: number | null;
};

type ScoreEntry = {
  genMin: number;
  genMax: number;
  total: number;
  communities: Partial<Record<CommunityKey, CommunityEntry>>;
};

type RankBreakpoint = {
  score: number;
  genMin: number;
  genMax: number;
};

type RankDataset = {
  totalStudents: number;
  rankBreakpoints: RankBreakpoint[];
  scoreMap: Record<string, ScoreEntry>;
};

// ── Bundled dataset (fetched from public/data/rank2026.json) ──────────────────

let _bundledDataset: RankDataset | null = null;
let _loadPromise: Promise<void> | null = null;

/**
 * Call once on client mount. Fetches /data/rank2026.json into memory and
 * fires "rank2026-updated" so any listening state syncs automatically.
 */
export function initBundledRankData(): Promise<void> {
  if (_bundledDataset) return Promise.resolve();
  if (_loadPromise) return _loadPromise;
  _loadPromise = (async () => {
    try {
      const res = await fetch("/data/rank2026.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _bundledDataset = (await res.json()) as RankDataset;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rank2026-updated"));
      }
    } catch (e) {
      console.warn("Could not load bundled rank data:", e);
    }
  })();
  return _loadPromise;
}

// ── localStorage override (admin CSV upload) ──────────────────────────────────

const LS_KEY = "rank2026";

function load2026FromStorage(): RankDataset | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RankDataset;
  } catch {
    return null;
  }
}

export function save2026ToStorage(dataset: RankDataset): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(dataset));
  window.dispatchEvent(new Event("rank2026-updated"));
}

export function clear2026Storage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LS_KEY);
  window.dispatchEvent(new Event("rank2026-updated"));
}

export function has2026Data(): boolean {
  if (typeof window === "undefined") return false;
  return !!_bundledDataset || !!window.localStorage.getItem(LS_KEY);
}

function getDataset(): { dataset: RankDataset; year: 2026 } | null {
  // localStorage upload takes precedence over bundled data
  const d2026 = load2026FromStorage() ?? _bundledDataset;
  if (!d2026) return null;
  return { dataset: d2026, year: 2026 };
}

function scoreKey(score: number): string {
  return score.toFixed(3);
}

export type ScoreToRanksResult = {
  year: 2026;
  totalStudents: number;
  score: number;
  genMin: number;
  genMax: number;
  total: number;
  studentsAbove: number;
  percentile: number;
  community: CommunityEntry | null;
};

export function scoreToRanks(
  score: number,
  community: CommunityKey
): ScoreToRanksResult | null {
  const resolved = getDataset();
  if (!resolved) return null;

  const { dataset, year } = resolved;
  const key = scoreKey(score);
  const entry = dataset.scoreMap[key];
  if (!entry) return null;

  const studentsAbove = entry.genMin - 1;
  const percentile = parseFloat(
    (((studentsAbove + 1) / dataset.totalStudents) * 100).toFixed(1)
  );

  return {
    year,
    totalStudents: dataset.totalStudents,
    score,
    genMin: entry.genMin,
    genMax: entry.genMax,
    total: entry.total,
    studentsAbove,
    percentile,
    community: entry.communities[community] ?? null,
  };
}

export type RankToScoreResult = {
  year: 2026;
  rank: number;
  score: number;
  genMin: number;
  genMax: number;
  total: number;
  community: CommunityKey | null;
};

export function rankToScore(generalRank: number): RankToScoreResult | null {
  const resolved = getDataset();
  if (!resolved) return null;

  const { dataset, year } = resolved;
  const bp = dataset.rankBreakpoints;

  let lo = 0;
  let hi = bp.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const { genMin, genMax } = bp[mid];
    if (generalRank < genMin) {
      hi = mid - 1;
    } else if (generalRank > genMax) {
      lo = mid + 1;
    } else {
      const entry = dataset.scoreMap[scoreKey(bp[mid].score)];

      // Identify the community this specific rank belongs to by checking
      // which community's general-rank range contains the given rank.
      let community: CommunityKey | null = null;
      if (entry) {
        for (const [key, comm] of Object.entries(entry.communities)) {
          if (comm && comm.genMin <= generalRank && generalRank <= comm.genMax) {
            community = key as CommunityKey;
            break;
          }
        }
      }

      return {
        year,
        rank: generalRank,
        score: bp[mid].score,
        genMin,
        genMax,
        total: entry?.total ?? 0,
        community,
      };
    }
  }
  return null;
}

export function processRankCsv(csvText: string): RankDataset {
  const lines = csvText.split(/\r?\n/);
  const scoreMapBuild = new Map<
    string,
    {
      score: number;
      genMin: number;
      genMax: number;
      total: number;
      communities: Partial<Record<CommunityKey, CommunityEntry>>;
    }
  >();
  let totalStudents = 0;

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 6) continue;
    const aggregateMark = parseFloat(parts[2]);
    const generalRank = parseInt(parts[3], 10);
    const community = parts[4].trim().toUpperCase() as CommunityKey;
    const communityRank = parseInt(parts[5], 10);
    if (isNaN(aggregateMark) || isNaN(generalRank)) continue;

    totalStudents++;
    const key = aggregateMark.toFixed(3);

    if (!scoreMapBuild.has(key)) {
      scoreMapBuild.set(key, {
        score: aggregateMark,
        genMin: generalRank,
        genMax: generalRank,
        total: 0,
        communities: {},
      });
    }
    const e = scoreMapBuild.get(key)!;
    e.total++;
    if (generalRank < e.genMin) e.genMin = generalRank;
    if (generalRank > e.genMax) e.genMax = generalRank;

    if (!e.communities[community]) {
      e.communities[community] = {
        count: 0,
        genMin: generalRank,
        genMax: generalRank,
        commMin: communityRank,
        commMax: communityRank,
      };
    }
    const c = e.communities[community]!;
    c.count++;
    if (generalRank < c.genMin) c.genMin = generalRank;
    if (generalRank > c.genMax) c.genMax = generalRank;
    if (c.commMin === null || communityRank < c.commMin) c.commMin = communityRank;
    if (c.commMax === null || communityRank > c.commMax) c.commMax = communityRank;
  }

  const sorted = [...scoreMapBuild.values()].sort((a, b) => b.score - a.score);
  const rankBreakpoints: RankBreakpoint[] = sorted.map((e) => ({
    score: e.score,
    genMin: e.genMin,
    genMax: e.genMax,
  }));
  const scoreMapOut: Record<string, ScoreEntry> = {};
  for (const e of sorted) {
    scoreMapOut[e.score.toFixed(3)] = {
      genMin: e.genMin,
      genMax: e.genMax,
      total: e.total,
      communities: e.communities,
    };
  }

  return { totalStudents, rankBreakpoints, scoreMap: scoreMapOut };
}

/** Rank input is always available; lookup requires 2026 CSV upload. */
export function isRankUnlocked(): boolean {
  return true;
}
