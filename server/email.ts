import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { storage } from "./storage";
import { log } from "./index";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export interface SendEmailOptions {
  tenantId: string;
  to: string;
  toName?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
}

function interpolateVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

export async function sendEmail(options: SendEmailOptions): Promise<{ status: string; logId: string }> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@localhost";
  const transport = getTransporter();

  const emailLog = await storage.createEmailLog({
    tenantId: options.tenantId,
    templateId: options.templateId || null,
    toEmail: options.to,
    toName: options.toName || null,
    subject: options.subject,
    status: "QUEUED",
  });

  if (!transport) {
    log(`Email queued (SMTP not configured): to=${options.to} subject="${options.subject}"`, "email");
    return { status: "QUEUED", logId: emailLog.id };
  }

  try {
    await transport.sendMail({
      from,
      to: options.toName ? `${options.toName} <${options.to}>` : options.to,
      subject: options.subject,
      html: options.html || undefined,
      text: options.text || undefined,
    });

    await storage.updateEmailLog(emailLog.id, {
      status: "SENT",
      sentAt: new Date(),
    });

    log(`Email sent: to=${options.to} subject="${options.subject}"`, "email");
    return { status: "SENT", logId: emailLog.id };
  } catch (err: any) {
    await storage.updateEmailLog(emailLog.id, {
      status: "FAILED",
      errorMessage: err.message || "Unknown error",
    });

    log(`Email failed: to=${options.to} error="${err.message}"`, "email");
    return { status: "FAILED", logId: emailLog.id };
  }
}

export async function sendTemplateEmail(
  tenantId: string,
  templateId: string,
  to: string,
  toName: string | undefined,
  variables: Record<string, string>,
): Promise<{ status: string; logId: string }> {
  const template = await storage.getEmailTemplate(templateId);
  if (!template || template.tenantId !== tenantId) {
    throw new Error("Template not found");
  }
  if (!template.isActive) {
    throw new Error("Template is inactive");
  }

  const subject = interpolateVariables(template.subject, variables);
  const html = template.bodyHtml ? interpolateVariables(template.bodyHtml, variables) : undefined;
  const text = template.bodyText ? interpolateVariables(template.bodyText, variables) : undefined;

  return sendEmail({ tenantId, to, toName, subject, html, text, templateId });
}
