import { buildReportEmail, type ReportEmailData } from "./buildReportEmail";
import { buildReportPdf, reportPdfFilename } from "@/lib/pdf/buildReportPdf";
import type { ReportSnapshot } from "@/lib/types/reportSnapshot";
import { getFromAddress, getSmtpTransporter, isSmtpConfigured } from "./smtp";

export async function sendReportEmail(
  to: string,
  data: ReportEmailData,
  reportSnapshot?: ReportSnapshot | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "SMTP not configured" };
  }

  const transporter = getSmtpTransporter()!;
  const hasPdf = Boolean(reportSnapshot && reportSnapshot.cutoffScore > 0);
  const { subject, html, text } = buildReportEmail({ ...data, hasPdf });

  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];

  if (hasPdf && reportSnapshot) {
    try {
      const pdfBuffer = await buildReportPdf(reportSnapshot, data.name);
      attachments.push({
        filename: reportPdfFilename(reportSnapshot, data.name),
        content: pdfBuffer,
        contentType: "application/pdf",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate PDF";
      return { ok: false, error: message };
    }
  }

  try {
    await transporter.sendMail({
      from: `"NGCult CollegeMap" <${getFromAddress()}>`,
      to,
      subject,
      html,
      text,
      replyTo: getFromAddress(),
      attachments,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { ok: false, error: message };
  }
}
