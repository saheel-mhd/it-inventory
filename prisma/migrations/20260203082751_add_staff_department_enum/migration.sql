/*
  Warnings:

  - Changed the type of `department` on the `Staff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Department" AS ENUM ('IT', 'FINANCE', 'HR', 'OPERATIONS', 'SALES');

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "department",
ADD COLUMN     "department" "Department" NOT NULL;

-- AlterTable
ALTER TABLE "StaffInventory" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;
