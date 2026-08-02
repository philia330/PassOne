/*
  Warnings:

  - You are about to alter the column `status` on the `baa` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(2))`.

*/
-- AlterTable
-- Step 1: samakan semua data lama jadi SELESAI
UPDATE `baa` SET `status` = 'SELESAI';

-- Step 2: kunci enum jadi cuma 1 value
ALTER TABLE `baa` MODIFY COLUMN `status`
  ENUM('SELESAI') NOT NULL DEFAULT 'SELESAI';
