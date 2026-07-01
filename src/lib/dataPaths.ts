import path from "path";

/** Root of all bundled CSV / processed data (inside collegemap, never parent repo). */
export const DATA_ROOT = path.join(process.cwd(), "data");

export const DATA_PATHS = {
  cutoff: path.join(DATA_ROOT, "cutoff", "tnea_cutoff_2025.csv"),
  cutoffBatchesDir: path.join(DATA_ROOT, "cutoff", "batches"),
  ranksDir: path.join(DATA_ROOT, "ranks"),
  rankCsv: (year: number | string) =>
    path.join(DATA_ROOT, "ranks", `ACADEMIC_GENERAL_RANK_LIST_${year}.csv`),
  processedDir: path.join(DATA_ROOT, "processed"),
  rankJson: (year: number | string) =>
    path.join(DATA_ROOT, "processed", `rank${year}.json`),
  publicRankJson: (year: number | string) =>
    path.join(process.cwd(), "public", "data", `rank${year}.json`),
} as const;
