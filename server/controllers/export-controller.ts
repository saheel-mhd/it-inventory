import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { getCurrentAdmin } from "~/server/auth/session";
import { writeAuditLog } from "~/server/services/audit-log";
import { buildExportFile } from "~/server/services/export-service";

export async function exportData(request: Request) {
  const actor = await getCurrentAdmin();
  if (!actor) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const file = await buildExportFile(request);
  if ("error" in file) {
    return NextResponse.json({ error: file.error }, { status: 400 });
  }

  const url = new URL(request.url);
  await writeAuditLog(prisma, {
    actor,
    action: "EXPORT_GENERATED",
    entityType: "Export",
    summary: "Generated export file.",
    metadata: {
      entity: url.searchParams.get("entity"),
      format: url.searchParams.get("format"),
      template: url.searchParams.get("template") === "1",
      filename: file.filename,
    },
  });

  return new NextResponse(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
    },
  });
}
