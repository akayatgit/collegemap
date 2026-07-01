/**
 * pdf-to-csv.mjs — Extract TNEA 2026 Academic General Rank List from PDF to CSV
 *
 * Input:  data/ranks/Academic_2026.pdf
 * Output: data/ranks/ACADEMIC_GENERAL_RANK_LIST_2026.csv
 *
 * Usage:  node scripts/pdf-to-csv.mjs
 *
 * PDF row format (all concatenated on one line):
 *   {s_no}{application_number(6)}{mark_int(1-3)}.{mark_dec(3)}{gen_rank}{community}{comm_rank?}
 * e.g.  1361024200.0001BC1
 *       6202640200.0006OC
 *       100305848199.500100BC59
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_PATH  = resolve(__dirname, "../data/ranks/Academic_2026.pdf");
const OUT_DIR   = resolve(__dirname, "../data/ranks");
const OUT_PATH  = resolve(OUT_DIR,   "ACADEMIC_GENERAL_RANK_LIST_2026.csv");

if (!existsSync(PDF_PATH)) {
  console.error(`PDF not found: ${PDF_PATH}`);
  process.exit(1);
}

console.log("Loading pdf-parse…");
const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;

console.log("Parsing PDF — this may take 2-4 minutes for 5438 pages…");
const buf  = readFileSync(PDF_PATH);
const data = await pdfParse(buf);
console.log(`Total pages: ${data.numpages}`);

// Non-greedy s_no ensures the shortest (and correct) split when
// application numbers start with the same digit as s_no.
// Community tokens: BC, BCM, MBC, OC, SC, SCA, ST
const ROW_RE = /^(\d+?)(\d{6})(\d{1,3}\.\d{3})(\d+)(BC|BCM|MBC|OC|SC|SCA|ST)(\d+)?$/;

const lines = data.text.split(/\r?\n/);
const rows  = [];
let skipped = 0;

for (const raw of lines) {
  const line = raw.trim();
  if (!line) continue;

  const m = ROW_RE.exec(line);
  if (!m) { skipped++; continue; }

  const [, s_no, application_number, aggregate_mark, general_rank, community, community_rank = ""] = m;

  // Sanity: s_no must equal general_rank for a legitimate row
  if (s_no !== general_rank) { skipped++; continue; }

  rows.push(`${s_no},${application_number},${aggregate_mark},${general_rank},${community},${community_rank}`);
}

console.log(`Extracted ${rows.length.toLocaleString("en-IN")} student rows`);
console.log(`Skipped   ${skipped.toLocaleString("en-IN")} non-data lines (headers / page labels)`);

mkdirSync(OUT_DIR, { recursive: true });

const csv = "s_no,application_number,aggregate_mark,general_rank,community,community_rank\n" + rows.join("\n") + "\n";
writeFileSync(OUT_PATH, csv, "utf8");

const kb = Math.round(csv.length / 1024);
console.log(`\nWritten → ${OUT_PATH}`);
console.log(`File size: ~${kb} KB (~${Math.round(kb / 1024)} MB)`);
console.log("\nDone! Run next: npm run process-ranks -- 2026");
