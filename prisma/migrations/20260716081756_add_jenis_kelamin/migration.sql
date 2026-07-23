/*
  Warnings:

  - Added the required column `jkl` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `jkl` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL;
