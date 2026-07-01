/**
 * process-rank-list.mjs
 *
 * Reads  data/ranks/ACADEMIC_GENERAL_RANK_LIST_<year>.csv
 * Writes  data/processed/rank<year>.json
 *
 * Usage:  node scripts/process-rank-list.mjs [year]
 *         npm run process-ranks -- 2026
 */

import { createReadStream, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const year = process.argv[2] || "2026";
const CSV_PATH = resolve(__dirname, `../data/ranks/ACADEMIC_GENERAL_RANK_LIST_${year}.csv`);
const OUT_DIR = resolve(__dirname, "../data/processed");
const OUT_PATH = resolve(OUT_DIR, `rank${year}.json`);

if (!existsSync(CSV_PATH)) {
  console.error(`CSV not found: ${CSV_PATH}`);
  console.error(`Place ACADEMIC_GENERAL_RANK_LIST_${year}.csv in data/ranks/`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const scoreMap = new Map();
let totalStudents = 0;

console.log("Reading CSV…", CSV_PATH);

const rl = createInterface({
  input: createReadStream(CSV_PATH, { encoding: "utf8" }),
  crlfDelay: Infinity,
});

let firstLine = true;

rl.on("line", (line) => {
  if (firstLine) {
    firstLine = false;
    return;
  }
  const parts = line.split(",");
  if (parts.length < 6) return;

  const aggregateMark = parseFloat(parts[2]);
  const generalRank = parseInt(parts[3], 10);
  const community = parts[4].trim().toUpperCase();
  const communityRank = parseInt(parts[5], 10);

  if (isNaN(aggregateMark) || isNaN(generalRank)) return;

  totalStudents++;

  const key = aggregateMark.toFixed(3);

  if (!scoreMap.has(key)) {
    scoreMap.set(key, {
      score: aggregateMark,
      genMin: generalRank,
      genMax: generalRank,
      total: 0,
      communities: {},
    });
  }
  const entry = scoreMap.get(key);
  entry.total++;
  if (generalRank < entry.genMin) entry.genMin = generalRank;
  if (generalRank > entry.genMax) entry.genMax = generalRank;

  if (!entry.communities[community]) {
    entry.communities[community] = {
      count: 0,
      genMin: generalRank,
      genMax: generalRank,
      commMin: communityRank,
      commMax: communityRank,
    };
  }
  const c = entry.communities[community];
  c.count++;
  if (generalRank < c.genMin) c.genMin = generalRank;
  if (generalRank > c.genMax) c.genMax = generalRank;
  if (communityRank < c.commMin) c.commMin = communityRank;
  if (communityRank > c.commMax) c.commMax = communityRank;
});

rl.on("close", () => {
  console.log(`Processed ${totalStudents} students, ${scoreMap.size} unique scores`);

  const sortedScores = [...scoreMap.values()].sort((a, b) => b.score - a.score);

  const rankBreakpoints = sortedScores.map((e) => ({
    score: e.score,
    genMin: e.genMin,
    genMax: e.genMax,
  }));

  const scoreMapOut = {};
  for (const e of sortedScores) {
    const key = e.score.toFixed(3);
    scoreMapOut[key] = {
      genMin: e.genMin,
      genMax: e.genMax,
      total: e.total,
      communities: e.communities,
    };
  }

  const output = {
    totalStudents,
    generatedAt: new Date().toISOString(),
    year: Number(year),
    rankBreakpoints,
    scoreMap: scoreMapOut,
  };

  writeFileSync(OUT_PATH, JSON.stringify(output), "utf8");
  console.log(`Written → ${OUT_PATH}`);
  const kb = Math.round(JSON.stringify(output).length / 1024);
  console.log(`File size: ~${kb} KB`);
});
