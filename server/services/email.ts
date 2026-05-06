import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "~/lib/logger";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });
  return transporter;
}

export type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Sends an email if SMTP is configured (`SMTP_HOST` set), otherwise logs the
 * payload to stdout. The logging fallback lets developers exercise reset
 * flows without setting up a real mail server.
 */
export async function sendEmail(args: SendEmailArgs): Promise<{ delivered: boolean }> {
  const t = getTransporter();
  const from = process.env.SMTP_FROM ?? "CustodyHub <noreply@example.com>";

  if (!t) {
    logger.warn("email.skip.no_smtp", {
      to: args.to,
      subject: args.subject,
      preview: args.text.slice(0, 200),
    });
    return { delivered: false };
  }

  await t.sendMail({
    from,
    to: args.to,
    subject: args.subject,
    text: args.text,
    html: args.html,
  });
  logger.info("email.sent", { to: args.to, subject: args.subject });
  return { delivered: true };
}
