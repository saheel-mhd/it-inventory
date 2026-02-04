-- CreateTable
CREATE TABLE "DepartmentModel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "DepartmentModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyPeriodModel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    CONSTRAINT "WarrantyPeriodModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentModel_code_key" ON "DepartmentModel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentModel_name_key" ON "DepartmentModel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyPeriodModel_code_key" ON "WarrantyPeriodModel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyPeriodModel_name_key" ON "WarrantyPeriodModel"("name");

-- Seed default department rows
INSERT INTO "DepartmentModel" ("id", "code", "name") VALUES
  ('dept_it', 'IT', 'IT'),
  ('dept_finance', 'FINANCE', 'Finance'),
  ('dept_hr', 'HR', 'HR'),
  ('dept_operations', 'OPERATIONS', 'Operations'),
  ('dept_sales', 'SALES', 'Sales')
ON CONFLICT ("code") DO NOTHING;

-- Seed default warranty rows
INSERT INTO "WarrantyPeriodModel" ("id", "code", "name", "months") VALUES
  ('wp_3m', 'THREE_MONTHS', '3 months', 3),
  ('wp_6m', 'SIX_MONTHS', '6 months', 6),
  ('wp_1y', 'ONE_YEAR', '1 year', 12)
ON CONFLICT ("code") DO NOTHING;

-- Add nullable relation columns first
ALTER TABLE "Staff" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "Product" ADD COLUMN "warrantyPeriodId" TEXT;

-- Backfill relation columns from enum text values
UPDATE "Staff" s
SET "departmentId" = d."id"
FROM "DepartmentModel" d
WHERE d."code" = s."department"::text;

UPDATE "Product" p
SET "warrantyPeriodId" = w."id"
FROM "WarrantyPeriodModel" w
WHERE p."warranty" IS NOT NULL
  AND w."code" = p."warranty"::text;

-- Make staff department required after backfill
ALTER TABLE "Staff" ALTER COLUMN "departmentId" SET NOT NULL;

-- Add foreign keys
ALTER TABLE "Staff"
  ADD CONSTRAINT "Staff_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "DepartmentModel"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_warrantyPeriodId_fkey"
  FOREIGN KEY ("warrantyPeriodId") REFERENCES "WarrantyPeriodModel"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop enum-based columns
ALTER TABLE "Staff" DROP COLUMN "department";
ALTER TABLE "Product" DROP COLUMN "warranty";

-- Drop unused enum types
DROP TYPE IF EXISTS "Department";
DROP TYPE IF EXISTS "WarrantyPeriod";
