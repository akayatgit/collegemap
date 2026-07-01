import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
  );
}

export function getSmtpTransporter(): Transporter | null {
  if (!isSmtpConfigured()) return null;

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export function getFromAddress(): string {
  return process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "support@nextgencult.com";
}
