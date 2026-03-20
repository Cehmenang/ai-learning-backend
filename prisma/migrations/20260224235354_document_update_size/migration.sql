/*
  Warnings:

  - Changed the type of `size` on the `Document` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "size",
ADD COLUMN     "size" BIGINT NOT NULL;
