/*
  Warnings:

  - You are about to drop the `baateknisi` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `baateknisi` DROP FOREIGN KEY `BaaTeknisi_id_baa_fkey`;

-- DropForeignKey
ALTER TABLE `baateknisi` DROP FOREIGN KEY `BaaTeknisi_id_user_fkey`;

-- DropTable
DROP TABLE `baateknisi`;

-- CreateTable
CREATE TABLE `baa_teknisi` (
    `id_baa_teknisi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_baa` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BaaTeknisi_id_user_fkey`(`id_user`),
    UNIQUE INDEX `BaaTeknisi_id_baa_id_user_key`(`id_baa`, `id_user`),
    PRIMARY KEY (`id_baa_teknisi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `baa_teknisi` ADD CONSTRAINT `BaaTeknisi_id_baa_fkey` FOREIGN KEY (`id_baa`) REFERENCES `baa`(`id_baa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `baa_teknisi` ADD CONSTRAINT `BaaTeknisi_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;
