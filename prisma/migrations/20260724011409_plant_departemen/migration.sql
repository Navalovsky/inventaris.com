/*
  Warnings:

  - You are about to drop the column `destination` on the `StockOut` table. All the data in the column will be lost.
  - Added the required column `departemen` to the `StockOut` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plant` to the `StockOut` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `StockOut` DROP COLUMN `destination`,
    ADD COLUMN `departemen` VARCHAR(191) NOT NULL,
    ADD COLUMN `plant` VARCHAR(191) NOT NULL;
