import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import {
  clearSessionResponse,
  createSessionResponse,
  getCurrentAdmin,
  getActiveSessionCredentialUser,
  revokeAllSessionsForUser,
} from "~/server/auth/session";
import { validatePassword } from "~/server/auth/password-policy";
import {
  clearFailedLogins,
  isLoginRateLimited,
  recordFailedLogin,
} from "~/server/auth/login-rate-limit";
import { getClientIp } from "~/server/middleware/request-meta";
import { parseJsonSafely } from "~/server/middleware/route";
import {
  createActorUpdateFields,
  writeAuditLog,
} from "~/server/services/audit-log";
import { logger } from "~/lib/logger";

type LoginPayload = {
  username?: string;
  password?: string;
};

type ChangePasswordPayload = {
  currentPassword?: string;
  newPassword?: string;
};

export async function login(request: Request) {
  const parsed = await parseJsonSafely<LoginPayload>(request, {
    ok: false,
    message: "Username and password are required.",
  });
  if (parsed.response) return parsed.response;

  const { username, password } = parsed.data;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, message: "DATABASE_URL is missing on server (.env not loaded)." },
      { status: 500 },
    );
  }

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, message: "Username and password are required." },
      { status: 400 },
    );
  }

  // Pre-computed bcrypt hash of an empty string. Compared against when the
  // username doesn't exist so the request takes the same time as a real
  // failed login — prevents user enumeration via timing.
  const DUMMY_HASH = "$2b$12$abcdefghijklmnopqrstuuOuTd5NIA9PFnpFBkqQdgg2spjhdvQ5C";

  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");

  try {
    if (await isLoginRateLimited({ username, ip })) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Too many failed attempts. Try again in a few minutes or contact admin.",
        },
        { status: 429 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { name: username },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isActive: true,
        role: true,
      },
    });

    const passwordToCompare = user?.password ?? DUMMY_HASH;
    const isValid = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isValid) {
      await recordFailedLogin({ username, ip });
      return NextResponse.json(
        { ok: false, message: "Invalid credentials." },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { ok: false, message: "Your account is inactive. Contact admin." },
        { status: 403 },
      );
    }

    await clearFailedLogins(username);

    const actor = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "MANAGER" | "USER",
    };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        ...createActorUpdateFields(actor),
      },
    });

    await writeAuditLog(prisma, {
      actor,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      summary: `${user.name} logged in.`,
    });

    return createSessionResponse({ ok: true }, user.id, { userAgent, ip });
  } catch (error) {
    logger.error("auth.login.failure", { username, ip }, error);
    return NextResponse.json(
      { ok: false, message: "Internal Server Error (check server logs)." },
      { status: 500 },
    );
  }
}

export async function logout() {
  const actor = await getCurrentAdmin();
  if (actor) {
    await writeAuditLog(prisma, {
      actor,
      action: "LOGOUT",
      entityType: "User",
      entityId: actor.id,
      summary: `${actor.name} logged out.`,
    });
  }
  return await clearSessionResponse({ ok: true });
}

export async function changePassword(request: Request) {
  const sessionUser = await getActiveSessionCredentialUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const parsed = await parseJsonSafely<ChangePasswordPayload>(request);
  if (parsed.response) return parsed.response;

  const currentPassword = parsed.data.currentPassword ?? "";
  const newPassword = parsed.data.newPassword ?? "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required." },
      { status: 400 },
    );
  }

  const policy = validatePassword(newPassword);
  if (!policy.ok) {
    return NextResponse.json({ error: policy.error }, { status: 400 });
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current password." },
      { status: 400 },
    );
  }

  const isValid = await bcrypt.compare(currentPassword, sessionUser.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 },
    );
  }

  const hash = await bcrypt.hash(newPassword, 12);
  const actor = {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    role: sessionUser.role as "ADMIN" | "MANAGER" | "USER",
  };
  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { password: hash, ...createActorUpdateFields(actor) },
  });

  // Revoke all other sessions for this user — forces re-login on other
  // devices after a password change.
  await revokeAllSessionsForUser(sessionUser.id);

  await writeAuditLog(prisma, {
    actor,
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: sessionUser.id,
    summary: `${sessionUser.name} changed their password.`,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
