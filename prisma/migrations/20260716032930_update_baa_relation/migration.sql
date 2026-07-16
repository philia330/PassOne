/*
  Warnings:

  - Added the required column `id_odp` to the `Baa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `baa` ADD COLUMN `id_odp` INTEGER NOT NULL,
    ADD COLUMN `ping_ms` DECIMAL(65, 30) NULL,
    ADD COLUMN `port_odp` INTEGER NULL,
    ADD COLUMN `port_olt` INTEGER NULL,
    ADD COLUMN `rx_power_dbm` DECIMAL(65, 30) NULL,
    ADD COLUMN `speed_download` VARCHAR(191) NULL,
    ADD COLUMN `speed_upload` VARCHAR(191) NULL,
    ADD COLUMN `tx_power_dbm` DECIMAL(65, 30) NULL;

-- AddForeignKey
ALTER TABLE `Baa` ADD CONSTRAINT `Baa_id_odp_fkey` FOREIGN KEY (`id_odp`) REFERENCES `Odp`(`id_odp`) ON DELETE RESTRICT ON UPDATE CASCADE;
