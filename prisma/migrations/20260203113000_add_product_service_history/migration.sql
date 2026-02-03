-- CreateTable
CREATE TABLE "ProductService" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "repairable" BOOLEAN NOT NULL,
    "notes" TEXT,
    "sentToService" BOOLEAN NOT NULL,
    "vendorName" TEXT,
    "expectedReturnDate" TIMESTAMP(3),
    "serviced" BOOLEAN,
    "serviceDate" TIMESTAMP(3),
    "serviceCost" DECIMAL(65,30),
    "serviceMessage" TEXT,
    "serviceFailureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductService_productId_idx" ON "ProductService"("productId");

-- CreateIndex
CREATE INDEX "ProductService_sentToService_idx" ON "ProductService"("sentToService");

-- CreateIndex
CREATE INDEX "ProductService_serviced_idx" ON "ProductService"("serviced");

-- AddForeignKey
ALTER TABLE "ProductService" ADD CONSTRAINT "ProductService_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill legacy service fields from Product into ProductService (one record per product)
INSERT INTO "ProductService" (
  "id",
  "productId",
  "repairable",
  "notes",
  "sentToService",
  "vendorName",
  "expectedReturnDate",
  "serviced",
  "serviceDate",
  "serviceCost",
  "serviceMessage",
  "serviceFailureReason",
  "createdAt",
  "updatedAt"
)
SELECT
  CONCAT("id", '_legacy_service'),
  "id",
  COALESCE("repairable", false),
  "notes",
  COALESCE("sentToService", false),
  "serviceVendor",
  "serviceReturnDate",
  "serviceServiced",
  "serviceDate",
  "serviceCost",
  "serviceMessage",
  "serviceFailureReason",
  "createdAt",
  "updatedAt"
FROM "Product"
WHERE
  "notes" IS NOT NULL OR
  "repairable" IS NOT NULL OR
  "sentToService" IS NOT NULL OR
  "serviceVendor" IS NOT NULL OR
  "serviceReturnDate" IS NOT NULL OR
  "serviceServiced" IS NOT NULL OR
  "serviceDate" IS NOT NULL OR
  "serviceCost" IS NOT NULL OR
  "serviceMessage" IS NOT NULL OR
  "serviceFailureReason" IS NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "notes",
DROP COLUMN "repairable",
DROP COLUMN "sentToService",
DROP COLUMN "serviceCost",
DROP COLUMN "serviceDate",
DROP COLUMN "serviceFailureReason",
DROP COLUMN "serviceMessage",
DROP COLUMN "serviceReturnDate",
DROP COLUMN "serviceServiced",
DROP COLUMN "serviceVendor";
