import UsersSettingsClient from "~/app/components/settings/users-client";
import { prisma } from "~/lib/prisma";

const PAGE_SIZE = 10;

type UsersSearchParams = {
  q?: string | string[];
  page?: string | string[];
};

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

const getPage = (value: string | string[] | undefined) => {
  const raw = getParam(value);
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const formatDateTime = (value: Date | null) => {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(value);
};

export default async function SettingsUsersPage({
  searchParams,
}: {
  searchParams?: Promise<UsersSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = getParam(resolvedSearchParams?.q);
  const page = getPage(resolvedSearchParams?.page);

  const where = q
    ? {
        name: {
          contains: q,
          mode: "insensitive" as const,
        },
      }
    : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <UsersSettingsClient
      users={users.map((user) => ({
        ...user,
        createdAt: formatDateTime(user.createdAt) ?? "-",
        updatedAt: formatDateTime(user.updatedAt) ?? "-",
        lastLogin: formatDateTime(user.lastLogin),
      }))}
      q={q}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}
