import { prisma } from "~/lib/prisma";

const WINDOW_MINUTES = 15;
const MAX_FAILED_PER_USERNAME = 5;
const MAX_FAILED_PER_IP = 20;

const since = () => new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

export async function isLoginRateLimited(args: {
  username: string;
  ip: string | null;
}): Promise<boolean> {
  const cutoff = since();

  const usernameFails = await prisma.failedLogin.count({
    where: { username: args.username, createdAt: { gte: cutoff } },
  });
  if (usernameFails >= MAX_FAILED_PER_USERNAME) return true;

  if (args.ip) {
    const ipFails = await prisma.failedLogin.count({
      where: { ip: args.ip, createdAt: { gte: cutoff } },
    });
    if (ipFails >= MAX_FAILED_PER_IP) return true;
  }

  return false;
}

export async function recordFailedLogin(args: {
  username: string;
  ip: string | null;
}) {
  await prisma.failedLogin.create({
    data: { username: args.username, ip: args.ip ?? null },
  });
}

export async function clearFailedLogins(username: string) {
  await prisma.failedLogin.deleteMany({ where: { username } });
}
