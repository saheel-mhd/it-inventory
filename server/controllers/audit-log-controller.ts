import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma";

const PAGE_SIZE_DEFAULT = 50;
const PAGE_SIZE_MAX = 200;

export async function listAuditLogs(request: Request) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const action = url.searchParams.get("action");
  const entityType = url.searchParams.get("entityType");
  const actorUserId = url.searchParams.get("actorUserId");
  const search = url.searchParams.get("q");
  const sizeRaw = parseInt(url.searchParams.get("size") ?? "", 10);
  const size =
    Number.isFinite(sizeRaw) && sizeRaw > 0
      ? Math.min(sizeRaw, PAGE_SIZE_MAX)
      : PAGE_SIZE_DEFAULT;

  const where: Prisma.AuditLogWhereInput = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (actorUserId) where.actorUserId = actorUserId;
  if (search) {
    where.OR = [
      { actorName: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: size + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > size;
  const items = hasMore ? rows.slice(0, size) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}
