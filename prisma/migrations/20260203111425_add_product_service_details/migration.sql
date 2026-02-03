-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "serviceCost" DECIMAL(65,30),
ADD COLUMN     "serviceDate" TIMESTAMP(3),
ADD COLUMN     "serviceFailureReason" TEXT,
ADD COLUMN     "serviceMessage" TEXT,
ADD COLUMN     "serviceServiced" BOOLEAN;
