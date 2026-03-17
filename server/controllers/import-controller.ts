import { NextResponse } from "next/server";
import { getCurrentAdmin } from "~/server/auth/session";
import { processImportRequest } from "~/server/services/import-service";
import { prisma } from "~/lib/prisma";
import { writeAuditLog } from "~/server/services/audit-log";

export async function importData(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const result = await processImportRequest(request, actor);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAuditLog(prisma, {
    actor,
    action: "IMPORT_COMPLETED",
    entityType: "Import",
    summary: "Completed data import.",
    metadata: {
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errorCount: result.errors.length,
    },
  });

  return NextResponse.json(result, { status: 200 });
}
