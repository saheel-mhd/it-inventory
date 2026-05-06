import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "~/lib/prisma";
import { CSRF_COOKIE_NAME, generateCsrfToken } from "~/server/auth/csrf";

const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_DAYS = 10;
const SESSION_MAX_AGE = 60 * 60 * 24 * SESSION_TTL_DAYS;

export type UserRole = "ADMIN" | "MANAGER" | "USER";

export type CurrentAdmin = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
};

const sessionCookie = (value: string, maxAge: number) => ({
  name: SESSION_COOKIE_NAME,
  value,
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

const csrfCookie = (value: string, maxAge: number) => ({
  name: CSRF_COOKIE_NAME,
  value,
  httpOnly: false, // client JS reads this and echoes it as X-CSRF-Token
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateToken = () => crypto.randomBytes(32).toString("base64url");

async function loadSessionFromCookie() {
  const cookieValue = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  const tokenHash = hashToken(cookieValue);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          role: true,
          password: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (!session.user.isActive) return null;

  // Refresh lastSeenAt asynchronously; don't block the request.
  prisma.session
    .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
    .catch(() => {});

  return session;
}

export async function getActiveSessionStatusUser() {
  const session = await loadSessionFromCookie();
  if (!session) return null;
  return { id: session.user.id, isActive: session.user.isActive };
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await loadSessionFromCookie();
  if (!session) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as UserRole,
  };
}

export async function getActiveSessionAccountUser() {
  const session = await loadSessionFromCookie();
  if (!session) return null;
  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    role: u.role,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastLogin: u.lastLogin,
  };
}

export async function getActiveSessionCredentialUser() {
  const session = await loadSessionFromCookie();
  if (!session) return null;
  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    isActive: u.isActive,
    role: u.role,
  };
}

export async function createSessionResponse(
  body: unknown,
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
    },
  });

  const response = NextResponse.json(body);
  response.cookies.set(sessionCookie(token, SESSION_MAX_AGE));
  response.cookies.set(csrfCookie(generateCsrfToken(), SESSION_MAX_AGE));
  return response;
}

export async function clearSessionResponse(body: unknown = { ok: true }) {
  const cookieValue = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (cookieValue) {
    const tokenHash = hashToken(cookieValue);
    await prisma.session
      .deleteMany({ where: { tokenHash } })
      .catch(() => {});
  }
  const response = NextResponse.json(body);
  response.cookies.set(sessionCookie("", 0));
  response.cookies.set(csrfCookie("", 0));
  return response;
}

export async function revokeAllSessionsForUser(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
