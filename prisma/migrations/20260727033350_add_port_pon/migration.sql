-- CreateTable
CREATE TABLE `PortPon` (
    `id_port` INTEGER NOT NULL AUTO_INCREMENT,
    `nomor_port` INTEGER NOT NULL,
    `tipe_kartu` VARCHAR(191) NOT NULL,
    `status` ENUM('TERSEDIA', 'TERPAKAI') NOT NULL DEFAULT 'TERSEDIA',
    `id_olt` INTEGER NOT NULL,
    `id_odp` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PortPon_id_olt_nomor_port_key`(`id_olt`, `nomor_port`),
    PRIMARY KEY (`id_port`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PortPon` ADD CONSTRAINT `PortPon_id_olt_fkey` FOREIGN KEY (`id_olt`) REFERENCES `Olt`(`id_olt`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortPon` ADD CONSTRAINT `PortPon_id_odp_fkey` FOREIGN KEY (`id_odp`) REFERENCES `Odp`(`id_odp`) ON DELETE SET NULL ON UPDATE CASCADE;
