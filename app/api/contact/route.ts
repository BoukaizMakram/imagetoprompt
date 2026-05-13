import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TO = "makramboukaiz@gmail.com";

export async function POST(req: NextRequest) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromAddress = process.env.CONTACT_FROM_EMAIL || user;

  if (!host || !user || !pass) {
    return NextResponse.json(
      {
        error:
          "Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local. See README for setup.",
      },
      { status: 500 }
    );
  }

  let payload: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (payload.name ?? "").trim().slice(0, 200);
  const email = (payload.email ?? "").trim().slice(0, 200);
  const subject = (payload.subject ?? "").trim().slice(0, 200);
  const message = (payload.message ?? "").trim().slice(0, 8000);

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const finalSubject = subject ? `[Prompto] ${subject}` : `[Prompto] New message from ${name}`;
  const text = [
    `From: ${name} <${email}>`,
    subject ? `Subject: ${subject}` : null,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;color:#0a0a0a;">
      <h2 style="margin:0 0 16px;">New contact form message</h2>
      <p style="margin:0 0 4px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 4px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${subject ? `<p style="margin:0 0 4px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
      <pre style="white-space:pre-wrap;font-family:inherit;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(
        message
      )}</pre>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465 (SMTPS), false for 587 (STARTTLS)
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: TO,
      replyTo: `${name} <${email}>`,
      subject: finalSubject,
      text,
      html,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `Email send failed: ${String(e?.message || e).slice(0, 400)}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
