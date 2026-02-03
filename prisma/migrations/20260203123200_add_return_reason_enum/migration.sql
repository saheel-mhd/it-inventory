/*
  Warnings:

  - The `returnReason` column on the `StaffInventory` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('RESIGNED', 'DAMAGED', 'NOT_NEEDED', 'OTHER');

-- AlterTable
ALTER TABLE "StaffInventory" ADD COLUMN     "returnReasonNote" TEXT,
DROP COLUMN "returnReason",
ADD COLUMN     "returnReason" "ReturnReason";
