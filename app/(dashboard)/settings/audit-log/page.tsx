import { redirect } from "next/navigation";
import { getCurrentAdmin } from "~/server/auth/session";
import { prisma } from "~/lib/prisma";
import AuditLogClient from "~/app/components/settings/audit-log-client";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const actor = await getCurrentAdmin();
  if (!actor) redirect("/login");
  if (actor.role !== "ADMIN") redirect("/dashboard");

  const initial = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const initialItems = initial.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    actorUserId: row.actorUserId,
    actorName: row.actorName,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit log</h1>
        <p className="text-sm text-gray-600">
          Every action recorded by the system. Newest first.
        </p>
      </div>
      <AuditLogClient initialItems={initialItems} />
    </div>
  );
}
