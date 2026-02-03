-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "repairable" BOOLEAN,
ADD COLUMN     "sentToService" BOOLEAN,
ADD COLUMN     "serviceReturnDate" TIMESTAMP(3),
ADD COLUMN     "serviceVendor" TEXT;
