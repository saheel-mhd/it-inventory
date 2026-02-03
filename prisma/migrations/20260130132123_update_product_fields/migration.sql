/*
  Warnings:

  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - Made the column `sku` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `brand` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "name",
ALTER COLUMN "sku" SET NOT NULL,
ALTER COLUMN "brand" SET NOT NULL;
