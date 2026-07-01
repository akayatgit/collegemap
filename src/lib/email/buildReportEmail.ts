export type ReportEmailData = {
  name: string;
  cutoffScore?: number | null;
  rank?: number | null;
  category?: string | null;
  quota?: string | null;
  collegesOpen?: number | null;
  deptCount?: number | null;
  preferredDept?: string | null;
  hasPdf?: boolean;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReportEmail(data: ReportEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, cutoffScore, rank, category, quota, collegesOpen, deptCount, preferredDept } =
    data;
  const hasReport = cutoffScore != null && cutoffScore > 0;
  const catLabel = (category ?? quota ?? "OC").toUpperCase();

  const subject = hasReport
    ? `Your TNEA 2026 College Report — Cutoff ${cutoffScore} (${catLabel})`
    : "Your NGCult CollegeMap TNEA Report";

  const statRows = hasReport
    ? [
        ["Cutoff Score", `${cutoffScore} / 200`],
        ["Quota / Category", catLabel],
        ...(rank ? [["TNEA Rank", `#${rank.toLocaleString("en-IN")}`]] : []),
        ...(collegesOpen ? [["Colleges Open", String(collegesOpen)]] : []),
        ...(deptCount ? [["Departments Unlocked", String(deptCount)]] : []),
        ...(preferredDept ? [["Preferred Department", preferredDept]] : []),
      ]
    : [["Status", "Enter your cutoff on CollegeMap to generate your full report"]];

  const statsHtml = statRows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;font-size:14px;">${esc(label)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:700;color:#0a0a0a;font-size:14px;text-align:right;">${esc(value)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:2px solid #0a0a0a;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:#0a0a0a;padding:24px 28px;">
            <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#f5e642;">NGCult CollegeMap</p>
            <h1 style="margin:8px 0 0;font-size:22px;color:#f5e642;text-transform:uppercase;">Your TNEA 2026 Report</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 16px;font-size:16px;color:#0a0a0a;">Hi ${esc(name)},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
              ${
                hasReport
                  ? `Here's your personalised Tamil Nadu engineering counselling snapshot based on your <strong>${catLabel}</strong> cutoff of <strong>${cutoffScore}</strong>.`
                  : "Thanks for requesting your TNEA college report. Head to CollegeMap, enter your cutoff score, and we'll show every college and department you qualify for."
              }
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e5e5e0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              ${statsHtml}
            </table>
            ${
              hasReport
                ? `<p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.6;">
                    Your full report is attached as a <strong>PDF</strong> with department tables, city breakdown, Chennai &amp; TN college shortlists, and rank context.
                    Based on TNEA 2025 cutoff data — final seat availability is confirmed during counselling.
                  </p>`
                : ""
            }
            <a href="https://nextgencult.com" style="display:inline-block;padding:14px 28px;background:#f5e642;color:#0a0a0a;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;border:2px solid #0a0a0a;">
              Open CollegeMap →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;background:#fafaf8;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">
              Sent by NGCult CollegeMap · support@nextgencult.com<br>
              Tamil Nadu Engineering Admissions (TNEA) 2026
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textLines = [
    `Hi ${name},`,
    "",
    hasReport
      ? `Your TNEA 2026 report (${catLabel} cutoff: ${cutoffScore}):`
      : "Thanks for requesting your TNEA college report.",
    "",
    ...statRows.map(([l, v]) => `${l}: ${v}`),
    ...(data.hasPdf ? ["", "Full PDF report attached."] : []),
    "",
    "Open CollegeMap: https://nextgencult.com",
    "",
    "— NGCult CollegeMap · support@nextgencult.com",
  ];

  return { subject, html, text: textLines.join("\n") };
}
