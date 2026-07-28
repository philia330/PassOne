-- CreateTable
CREATE TABLE `BaaTeknisi` (
    `id_baa_teknisi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_baa` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BaaTeknisi_id_baa_id_user_key`(`id_baa`, `id_user`),
    PRIMARY KEY (`id_baa_teknisi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BaaTeknisi` ADD CONSTRAINT `BaaTeknisi_id_baa_fkey` FOREIGN KEY (`id_baa`) REFERENCES `Baa`(`id_baa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BaaTeknisi` ADD CONSTRAINT `BaaTeknisi_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;
