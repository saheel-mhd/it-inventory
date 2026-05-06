import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { logger } from "~/lib/logger";
import { validatePassword } from "~/server/auth/password-policy";
import { revokeAllSessionsForUser } from "~/server/auth/session";
import { sendEmail } from "~/server/services/email";
import { writeAuditLog } from "~/server/services/audit-log";

const TOKEN_TTL_MINUTES = 60;

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(request: Request) {
  let payload: { email?: string };
  try {
    payload = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ ok: true }); // do not leak parse errors
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: true }); // always 200 to avoid enumeration
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    logger.info("password_reset.unknown_email", { email });
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000),
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Reset your CustodyHub password",
    text:
      `Hi ${user.name},\n\n` +
      `Click the link below to reset your password. It expires in ${TOKEN_TTL_MINUTES} minutes:\n\n` +
      `${link}\n\n` +
      `If you didn't request this, ignore this email.`,
  });

  return NextResponse.json({ ok: true });
}

export async function performPasswordReset(request: Request) {
  let payload: { token?: string; password?: string };
  try {
    payload = (await request.json()) as { token?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = payload.token ?? "";
  const password = payload.password ?? "";
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }
  const policy = validatePassword(password);
  if (!policy.ok) {
    return NextResponse.json({ error: policy.error }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Reset link is invalid or expired." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Account unavailable." }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hash, updatedBy: user.id },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await revokeAllSessionsForUser(user.id);

  await writeAuditLog(prisma, {
    actor: { id: user.id, name: user.name },
    action: "PASSWORD_RESET",
    entityType: "User",
    entityId: user.id,
    summary: `${user.name} reset their password via email link.`,
  });

  return NextResponse.json({ ok: true });
}
