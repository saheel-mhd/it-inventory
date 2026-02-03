-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "cost" DECIMAL(65,30),
ADD COLUMN     "orderedDate" TIMESTAMP(3),
ADD COLUMN     "warranty" TEXT,
ADD COLUMN     "warrantyExpire" TIMESTAMP(3);
