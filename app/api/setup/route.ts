import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { logger } from "~/lib/logger";
import { validatePassword } from "~/server/auth/password-policy";
import { createSessionResponse } from "~/server/auth/session";
import { getClientIp } from "~/server/middleware/request-meta";
import { writeAuditLog } from "~/server/services/audit-log";

// One-shot endpoint: only succeeds when no User rows exist. Used by the
// /setup page to bootstrap the very first admin without needing shell
// access to run create-user.js.

type SetupPayload = {
  username?: string;
  password?: string;
  email?: string;
};

export async function GET() {
  const userCount = await prisma.user.count();
  return NextResponse.json({ initialized: userCount > 0 });
}

export async function POST(request: Request) {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json(
      { error: "Setup already complete. An admin already exists." },
      { status: 409 },
    );
  }

  let body: SetupPayload;
  try {
    body = (await request.json()) as SetupPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password ?? "";
  const email = body.email?.trim().toLowerCase() || null;

  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }
  const policy = validatePassword(password);
  if (!policy.ok) {
    return NextResponse.json({ error: policy.error }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: username,
      email,
      password: hash,
      role: "ADMIN",
      isActive: true,
    },
  });

  const ip = getClientIp(request);
  await writeAuditLog(prisma, {
    actor: { id: user.id, name: user.name },
    action: "SETUP_COMPLETED",
    entityType: "User",
    entityId: user.id,
    summary: `Initial admin "${user.name}" created via /setup.`,
  });
  logger.info("setup.completed", { userId: user.id, username });

  return createSessionResponse({ ok: true }, user.id, {
    userAgent: request.headers.get("user-agent"),
    ip,
  });
}
