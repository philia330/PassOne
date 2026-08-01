/*
  Warnings:

  - You are about to alter the column `status` on the `fab` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `fab` MODIFY `status` ENUM('OPEN', 'AKTIF') NOT NULL DEFAULT 'OPEN';
