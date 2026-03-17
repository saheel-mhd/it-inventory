import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import {
  clearSessionResponse,
  createSessionResponse,
  getCurrentAdmin,
  getActiveSessionCredentialUser,
} from "~/server/auth/session";
import { parseJsonSafely } from "~/server/middleware/route";
import {
  createActorUpdateFields,
  writeAuditLog,
} from "~/server/services/audit-log";

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

  try {
    const user = await prisma.user.findUnique({
      where: { name: username },
      select: { id: true, name: true, email: true, password: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Invalid credentials." },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        ...createActorUpdateFields({
          id: user.id,
          name: user.name,
          email: user.email,
        }),
      },
    });

    await writeAuditLog(prisma, {
      actor: { id: user.id, name: user.name, email: user.email },
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      summary: `${user.name} logged in.`,
    });

    return createSessionResponse({ ok: true }, user.id);
  } catch (error) {
    console.error("LOGIN API ERROR:", error);
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
  return clearSessionResponse({ ok: true });
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

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters." },
      { status: 400 },
    );
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
  await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      password: hash,
      ...createActorUpdateFields({
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
      }),
    },
  });

  await writeAuditLog(prisma, {
    actor: { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email },
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: sessionUser.id,
    summary: `${sessionUser.name} changed their password.`,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
