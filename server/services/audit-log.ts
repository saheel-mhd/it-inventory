import { Prisma, PrismaClient } from "@prisma/client";
import { CurrentAdmin } from "~/server/auth/session";

type AuditDbClient = PrismaClient | Prisma.TransactionClient;

type AuditEntry = {
  actor: CurrentAdmin;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export const createActorCreateFields = (actor: CurrentAdmin) => ({
  createdBy: actor.id,
  updatedBy: actor.id,
});

export const createActorUpdateFields = (actor: CurrentAdmin) => ({
  updatedBy: actor.id,
});

export async function writeAuditLog(db: AuditDbClient, entry: AuditEntry) {
  await db.auditLog.create({
    data: {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      actorUserId: entry.actor.id,
      actorName: entry.actor.name,
      summary: entry.summary ?? null,
      metadata: entry.metadata ?? undefined,
    },
  });
}
