-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE_USE', 'AVAILABLE', 'DAMAGED', 'UNDER_SERVICE');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "snNumber" TEXT,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "specification" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedTo" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_snNumber_key" ON "Product"("snNumber");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");
