import { createRequire } from "node:module";
import type { ReportSnapshot } from "@/lib/types/reportSnapshot";

// Load pdfkit via createRequire so its AFM font files resolve correctly relative
// to this module's location — works in both local dev and Vercel serverless.
const PDFDocument: typeof import("pdfkit") = createRequire(import.meta.url)("pdfkit");

type PDFDoc = InstanceType<typeof PDFDocument>;

const INK = "#0a0a0a";
const MUTED = "#666666";
const YELLOW = "#f5e642";
const PAGE_W = 595.28;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}

function ensureSpace(doc: PDFDoc, needed: number) {
  if (doc.y + needed > doc.page.height - MARGIN) {
    doc.addPage();
    doc.y = MARGIN;
  }
}

function sectionTitle(doc: PDFDoc, title: string) {
  ensureSpace(doc, 40);
  doc.moveDown(0.6);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(INK)
    .text(title.toUpperCase(), MARGIN, doc.y, { width: CONTENT_W });
  doc
    .moveTo(MARGIN, doc.y + 4)
    .lineTo(MARGIN + CONTENT_W, doc.y + 4)
    .strokeColor("#e0e0e0")
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.5);
}

function statBox(
  doc: PDFDoc,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string
) {
  doc.roundedRect(x, y, w, h, 6).fillAndStroke("#fafaf8", "#e5e5e0");
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(INK)
    .text(value, x + 10, y + 12, { width: w - 20 });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text(label.toUpperCase(), x + 10, y + h - 22, { width: w - 20 });
}

function drawTable(
  doc: PDFDoc,
  headers: string[],
  rows: string[][],
  colWidths: number[]
) {
  const rowH = 18;
  const headerH = 20;

  const drawHeader = () => {
    const y = doc.y;
    doc.rect(MARGIN, y, CONTENT_W, headerH).fill("#0a0a0a");
    let x = MARGIN;
    headers.forEach((h, i) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(YELLOW)
        .text(h, x + 4, y + 6, { width: colWidths[i] - 8 });
      x += colWidths[i];
    });
    doc.y = y + headerH;
  };

  ensureSpace(doc, headerH + rowH * 3);
  drawHeader();

  rows.forEach((row, ri) => {
    if (doc.y + rowH > doc.page.height - MARGIN) {
      doc.addPage();
      doc.y = MARGIN;
      drawHeader();
    }
    const y = doc.y;
    if (ri % 2 === 0) {
      doc.rect(MARGIN, y, CONTENT_W, rowH).fill("#fafaf8");
    }
    let x = MARGIN;
    row.forEach((cell, ci) => {
      doc
        .font(ci === 0 ? "Helvetica" : "Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(INK)
        .text(cell, x + 4, y + 5, { width: colWidths[ci] - 8, lineBreak: false });
      x += colWidths[ci];
    });
    doc.y = y + rowH;
  });
  doc.moveDown(0.4);
}

export function buildReportPdf(
  snapshot: ReportSnapshot,
  studentName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const cat = snapshot.category.toUpperCase();
    const pctTn = Math.round(
      (snapshot.uniqueColleges / snapshot.totalCollegesInDataset) * 100
    );

    // ── Header banner ─────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 90).fill(INK);
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(YELLOW)
      .text("NGCULT COLLEGEMAP", MARGIN, 28, { characterSpacing: 1.5 });
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(YELLOW)
      .text("YOUR TNEA 2026 REPORT", MARGIN, 46);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#aaaaaa")
      .text(
        `Prepared for ${studentName}  ·  ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
        MARGIN,
        72
      );

    doc.y = 110;

    // ── Intro ─────────────────────────────────────────────────────────────────
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(MUTED)
      .text(
        `Personalised Tamil Nadu engineering counselling snapshot for ${cat} cutoff ${snapshot.cutoffScore}. Based on TNEA 2025 cutoff data — use as a starting point; final seats confirmed during counselling.`,
        MARGIN,
        doc.y,
        { width: CONTENT_W, lineGap: 3 }
      );
    doc.moveDown(1);

    // ── Stat cards (2×2) ─────────────────────────────────────────────────────
    const boxW = (CONTENT_W - 12) / 2;
    const boxH = 52;
    const y0 = doc.y;
    statBox(doc, MARGIN, y0, boxW, boxH, "Departments Unlocked", fmt(snapshot.uniqueDepts));
    statBox(
      doc,
      MARGIN + boxW + 12,
      y0,
      boxW,
      boxH,
      "Colleges Open",
      fmt(snapshot.uniqueColleges)
    );
    statBox(doc, MARGIN, y0 + boxH + 10, boxW, boxH, "% of TN Colleges", `${pctTn}%`);
    statBox(
      doc,
      MARGIN + boxW + 12,
      y0 + boxH + 10,
      boxW,
      boxH,
      "Chennai Picks",
      fmt(snapshot.chennaiPicks)
    );
    doc.y = y0 + boxH * 2 + 28;

    // ── Score summary table ───────────────────────────────────────────────────
    sectionTitle(doc, "Your Profile");
    const profileRows: string[][] = [
      ["Cutoff Score", `${snapshot.cutoffScore} / 200`],
      ["Quota / Category", cat],
    ];
    if (snapshot.rank) profileRows.push(["TNEA Rank", `#${fmt(snapshot.rank)}`]);
    profileRows.push(
      ["Best Margin", `+${snapshot.bestMargin} pts`],
      ["Total Colleges in TN Dataset", fmt(snapshot.totalCollegesInDataset)]
    );
    if (snapshot.preferredDept) {
      profileRows.push(["Preferred Department", snapshot.preferredDept]);
    }
    if (snapshot.estimatedCount > 0) {
      profileRows.push([
        "Estimated Cutoffs",
        `${snapshot.estimatedCount} entries (marked ⚠ in lists)`,
      ]);
    }
    drawTable(doc, ["Field", "Value"], profileRows, [CONTENT_W * 0.45, CONTENT_W * 0.55]);

    // ── Rank context ─────────────────────────────────────────────────────────
    if (snapshot.rankContext) {
      const rc = snapshot.rankContext;
      sectionTitle(doc, `${rc.year} Rank Context`);
      const rankRows: string[][] = [
        [
          "General Rank",
          rc.genMin === rc.genMax
            ? `#${fmt(rc.genMin)}`
            : `#${fmt(rc.genMin)} – #${fmt(rc.genMax)}`,
        ],
        ["Percentile", `Top ${rc.percentile}%`],
        ["Students Scored Higher", fmt(rc.studentsAbove)],
        ["Total Students (${rc.year})", fmt(rc.totalStudents)],
      ];
      if (rc.commMin != null) {
        rankRows.splice(1, 0, [
          `${cat} Community Rank`,
          rc.commMin === rc.commMax
            ? `#${fmt(rc.commMin)}`
            : `#${fmt(rc.commMin)} – #${fmt(rc.commMax!)}`,
        ]);
      }
      drawTable(doc, ["Metric", "Value"], rankRows, [CONTENT_W * 0.45, CONTENT_W * 0.55]);
    }

    // ── Industry segments ─────────────────────────────────────────────────────
    if (snapshot.industrySegments.length > 0) {
      sectionTitle(doc, "Industry Segments");
      drawTable(
        doc,
        ["Segment", "Departments"],
        snapshot.industrySegments.map((s) => [s.label, String(s.value)]),
        [CONTENT_W * 0.7, CONTENT_W * 0.3]
      );
    }

    // ── City distribution ─────────────────────────────────────────────────────
    if (snapshot.cityDistribution.length > 0) {
      sectionTitle(doc, "City Distribution");
      drawTable(
        doc,
        ["City", "Colleges"],
        snapshot.cityDistribution.map((c) => [c.city, String(c.count)]),
        [CONTENT_W * 0.7, CONTENT_W * 0.3]
      );
    }

    // ── Department table ──────────────────────────────────────────────────────
    if (snapshot.deptTable.length > 0) {
      sectionTitle(doc, `Departments You Can Enroll In (${snapshot.deptTable.length})`);
      drawTable(
        doc,
        ["Department", "Min", "Max", "Colleges"],
        snapshot.deptTable.map((d) => [
          d.dept.length > 42 ? d.dept.slice(0, 40) + "…" : d.dept,
          String(d.minCutoff),
          String(d.maxCutoff),
          String(d.collegeCount),
        ]),
        [CONTENT_W * 0.52, CONTENT_W * 0.14, CONTENT_W * 0.14, CONTENT_W * 0.2]
      );
    }

    // ── Chennai shortlist ─────────────────────────────────────────────────────
    if (snapshot.chennaiTop.length > 0) {
      sectionTitle(doc, `Chennai Shortlist (${snapshot.chennaiTop.length})`);
      drawTable(
        doc,
        ["#", "Code", "College", "Best Dept", "Cutoff", "Margin"],
        snapshot.chennaiTop.map((c, i) => [
          String(i + 1),
          c.code,
          c.name.length > 28 ? c.name.slice(0, 26) + "…" : c.name,
          c.bestDept.length > 18 ? c.bestDept.slice(0, 16) + "…" : c.bestDept,
          String(c.bestCutoff) + (c.hasEstimated ? " ⚠" : ""),
          `+${c.margin}`,
        ]),
        [
          CONTENT_W * 0.05,
          CONTENT_W * 0.1,
          CONTENT_W * 0.32,
          CONTENT_W * 0.28,
          CONTENT_W * 0.12,
          CONTENT_W * 0.13,
        ]
      );
    }

    // ── TN shortlist ──────────────────────────────────────────────────────────
    if (snapshot.tnTop.length > 0) {
      sectionTitle(doc, `Tamil Nadu Shortlist (${snapshot.tnTop.length})`);
      drawTable(
        doc,
        ["#", "Code", "College", "City", "Best Dept", "Cutoff"],
        snapshot.tnTop.map((c, i) => [
          String(i + 1),
          c.code,
          c.name.length > 24 ? c.name.slice(0, 22) + "…" : c.name,
          c.city,
          c.bestDept.length > 16 ? c.bestDept.slice(0, 14) + "…" : c.bestDept,
          String(c.bestCutoff) + (c.hasEstimated ? " ⚠" : ""),
        ]),
        [
          CONTENT_W * 0.05,
          CONTENT_W * 0.09,
          CONTENT_W * 0.28,
          CONTENT_W * 0.14,
          CONTENT_W * 0.28,
          CONTENT_W * 0.16,
        ]
      );
    }

    // ── Footer on every page ──────────────────────────────────────────────────
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#999999")
        .text(
          `NGCult CollegeMap · support@nextgencult.com · TNEA 2026  ·  Page ${i + 1} of ${pages.count}`,
          MARGIN,
          doc.page.height - 30,
          { width: CONTENT_W, align: "center" }
        );
    }

    doc.end();
  });
}

export function reportPdfFilename(snapshot: ReportSnapshot, name: string): string {
  const safeName = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20) || "Student";
  return `TNEA-Report-${snapshot.category.toUpperCase()}-${snapshot.cutoffScore}-${safeName}.pdf`;
}
