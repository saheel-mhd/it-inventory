-- CreateTable
CREATE TABLE "SkuSequence" (
    "prefix" TEXT NOT NULL,
    "next" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SkuSequence_pkey" PRIMARY KEY ("prefix")
);
-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
