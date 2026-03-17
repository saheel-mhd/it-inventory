import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 10;

export type CurrentAdmin = {
  id: string;
  name: string;
  email: string | null;
};

const sessionCookie = (value: string, maxAge: number) => ({
  name: SESSION_COOKIE_NAME,
  value,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

export async function getSessionId() {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getActiveSessionStatusUser() {
  const sessionId = await getSessionId();
  if (!sessionId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { id: true, isActive: true },
  });

  return user?.isActive ? user : null;
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const sessionId = await getSessionId();
  if (!sessionId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { id: true, name: true, email: true, isActive: true },
  });

  return user?.isActive
    ? { id: user.id, name: user.name, email: user.email }
    : null;
}

export async function getActiveSessionAccountUser() {
  const sessionId = await getSessionId();
  if (!sessionId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true,
    },
  });

  return user?.isActive ? user : null;
}

export async function getActiveSessionCredentialUser() {
  const sessionId = await getSessionId();
  if (!sessionId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { id: true, name: true, email: true, password: true, isActive: true },
  });

  return user?.isActive ? user : null;
}

export function createSessionResponse(body: unknown, userId: string) {
  const response = NextResponse.json(body);
  response.cookies.set(sessionCookie(userId, SESSION_MAX_AGE));
  return response;
}

export function clearSessionResponse(body: unknown = { ok: true }) {
  const response = NextResponse.json(body);
  response.cookies.set(sessionCookie("", 0));
  return response;
}
