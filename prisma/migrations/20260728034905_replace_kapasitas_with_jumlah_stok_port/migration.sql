/*
  Warnings:

  - You are about to drop the column `kapasitas_maks` on the `odp` table. All the data in the column will be lost.
  - You are about to drop the column `kapasitas_min` on the `odp` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `odp` DROP COLUMN `kapasitas_maks`,
    DROP COLUMN `kapasitas_min`,
    ADD COLUMN `jumlah_port` INTEGER NULL,
    ADD COLUMN `stok_port` INTEGER NULL DEFAULT 0;
