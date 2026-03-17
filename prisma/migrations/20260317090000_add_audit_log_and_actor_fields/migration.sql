ALTER TABLE "Category"
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

ALTER TABLE "AssetType"
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

ALTER TABLE "Staff"
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

ALTER TABLE "DepartmentModel"
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

ALTER TABLE "WarrantyPeriodModel"
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

ALTER TABLE "StaffInventory"
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

ALTER TABLE "ProductService"
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "actorUserId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "summary" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
