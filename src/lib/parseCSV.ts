import fs from "fs";
import path from "path";
import Papa from "papaparse";
import type { CollegeRow } from "./types";
import { DATA_PATHS } from "./dataPaths";

export function getCollegeData(): CollegeRow[] {
  const csvPath = DATA_PATHS.cutoff;
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  const result = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
  });

  const rows: CollegeRow[] = [];

  for (let i = 1; i < result.data.length; i++) {
    const row = result.data[i];
    if (!row || row.length < 11) continue;

    rows.push({
      page: row[0]?.trim() ?? "",
      code: row[1]?.trim() ?? "",
      collegeName: row[2]?.trim() ?? "",
      branch: row[3]?.trim() ?? "",
      oc: row[4]?.trim() ?? "—",
      bc: row[5]?.trim() ?? "—",
      bcm: row[6]?.trim() ?? "—",
      mbc: row[7]?.trim() ?? "—",
      sc: row[8]?.trim() ?? "—",
      sca: row[9]?.trim() ?? "—",
      st: row[10]?.trim() ?? "—",
    });
  }

  return rows;
}

export function getUniqueCollegeCount(data: CollegeRow[]): number {
  return new Set(data.map((r) => r.code)).size;
}

export function getTotalBranchCount(data: CollegeRow[]): number {
  return data.length;
}
