import { Prisma, PrismaClient } from "@prisma/client";

type AuditDbClient = PrismaClient | Prisma.TransactionClient;

// Narrowed actor shape — writeAuditLog only needs id and name, plus the
// ActorFields helpers only need id. Keeping this independent of CurrentAdmin
// avoids ripple updates whenever the session shape gains fields.
export type AuditActor = {
  id: string;
  name: string;
};

type AuditEntry = {
  actor: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export const createActorCreateFields = (actor: AuditActor) => ({
  createdBy: actor.id,
  updatedBy: actor.id,
});

export const createActorUpdateFields = (actor: AuditActor) => ({
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
