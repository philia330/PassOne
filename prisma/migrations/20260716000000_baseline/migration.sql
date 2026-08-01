-- CreateTable
CREATE TABLE `activity_logs` (
    `id_log` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_DEACTIVATED', 'LOGIN', 'FAB_CREATED', 'FAB_UPDATED', 'BAA_CREATED', 'BAA_UPDATED', 'AREA_CREATED', 'AREA_UPDATED', 'POP_CREATED', 'POP_UPDATED', 'OLT_CREATED', 'OLT_UPDATED', 'ODP_CREATED', 'ODP_UPDATED', 'ONT_CREATED', 'ONT_UPDATED', 'PAKET_CREATED', 'PAKET_UPDATED', 'MATERIAL_CREATED', 'MATERIAL_UPDATED', 'SETTINGS_UPDATED') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `id_user` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_log` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `area` (
    `id_area` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_area` VARCHAR(191) NOT NULL,
    `nama_area` VARCHAR(191) NOT NULL,
    `keterangan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Area_kode_area_key`(`kode_area` ASC),
    PRIMARY KEY (`id_area` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `baa` (
    `id_baa` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_baa` VARCHAR(191) NOT NULL,
    `tanggal_instalasi` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'PROSES', 'SELESAI') NOT NULL DEFAULT 'PENDING',
    `catatan` VARCHAR(191) NULL,
    `foto_instalasi` VARCHAR(191) NULL,
    `id_fab` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `id_olt` INTEGER NOT NULL,
    `id_ont` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `id_odp` INTEGER NOT NULL,
    `ping_ms` DECIMAL(65, 30) NULL,
    `port_odp` INTEGER NULL,
    `port_olt` INTEGER NULL,
    `rx_power_dbm` DECIMAL(65, 30) NULL,
    `speed_download` VARCHAR(191) NULL,
    `speed_upload` VARCHAR(191) NULL,
    `tx_power_dbm` DECIMAL(65, 30) NULL,

    INDEX `Baa_id_fab_fkey`(`id_fab` ASC),
    INDEX `Baa_id_odp_fkey`(`id_odp` ASC),
    INDEX `Baa_id_olt_fkey`(`id_olt` ASC),
    INDEX `Baa_id_ont_fkey`(`id_ont` ASC),
    INDEX `Baa_id_user_fkey`(`id_user` ASC),
    UNIQUE INDEX `Baa_kode_baa_key`(`kode_baa` ASC),
    PRIMARY KEY (`id_baa` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `baa_teknisi` (
    `id_baa_teknisi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_baa` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BaaTeknisi_id_baa_id_user_key`(`id_baa` ASC, `id_user` ASC),
    INDEX `BaaTeknisi_id_user_fkey`(`id_user` ASC),
    PRIMARY KEY (`id_baa_teknisi` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `baadetail` (
    `id_baa_detail` INTEGER NOT NULL AUTO_INCREMENT,
    `id_baa` INTEGER NOT NULL,
    `id_material` INTEGER NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `keterangan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BaaDetail_id_baa_fkey`(`id_baa` ASC),
    INDEX `BaaDetail_id_material_fkey`(`id_material` ASC),
    PRIMARY KEY (`id_baa_detail` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fab` (
    `id_fab` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_fab` VARCHAR(191) NOT NULL,
    `nama_pelanggan` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NOT NULL,
    `no_hp` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(65, 30) NOT NULL,
    `longitude` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('PENDING', 'SURVEY', 'INSTALASI', 'SELESAI') NOT NULL DEFAULT 'PENDING',
    `id_area` INTEGER NOT NULL,
    `id_paket` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Fab_id_area_fkey`(`id_area` ASC),
    INDEX `Fab_id_paket_fkey`(`id_paket` ASC),
    INDEX `Fab_id_user_fkey`(`id_user` ASC),
    UNIQUE INDEX `Fab_kode_fab_key`(`kode_fab` ASC),
    UNIQUE INDEX `Fab_nik_key`(`nik` ASC),
    PRIMARY KEY (`id_fab` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material` (
    `id_material` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_material` VARCHAR(191) NOT NULL,
    `nama_material` VARCHAR(191) NOT NULL,
    `stok` INTEGER NOT NULL DEFAULT 0,
    `minimal_stok` INTEGER NOT NULL DEFAULT 5,
    `satuan` VARCHAR(191) NOT NULL,
    `harga` DECIMAL(65, 30) NOT NULL,
    `kondisi` ENUM('BAIK', 'RUSAK') NOT NULL DEFAULT 'BAIK',
    `keterangan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Material_kode_material_key`(`kode_material` ASC),
    PRIMARY KEY (`id_material` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `odp` (
    `id_odp` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_odp` VARCHAR(191) NOT NULL,
    `nama_odp` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(65, 30) NOT NULL,
    `longitude` DECIMAL(65, 30) NOT NULL,
    `id_olt` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `jumlah_port` INTEGER NULL,
    `stok_port` INTEGER NULL DEFAULT 0,

    INDEX `Odp_id_olt_fkey`(`id_olt` ASC),
    UNIQUE INDEX `Odp_kode_odp_key`(`kode_odp` ASC),
    PRIMARY KEY (`id_odp` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `olt` (
    `id_olt` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_olt` VARCHAR(191) NOT NULL,
    `nama_olt` VARCHAR(191) NOT NULL,
    `lokasi` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(65, 30) NOT NULL,
    `longitude` DECIMAL(65, 30) NOT NULL,
    `id_pop` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ip_olt` VARCHAR(191) NULL,
    `password_olt` VARCHAR(191) NULL,
    `username_olt` VARCHAR(191) NULL,
    `foto_olt` VARCHAR(191) NULL,

    INDEX `Olt_id_pop_fkey`(`id_pop` ASC),
    UNIQUE INDEX `Olt_kode_olt_key`(`kode_olt` ASC),
    PRIMARY KEY (`id_olt` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ont` (
    `id_ont` INTEGER NOT NULL AUTO_INCREMENT,
    `serial_number` VARCHAR(191) NOT NULL,
    `pelanggan` VARCHAR(191) NOT NULL,
    `status` ENUM('TERSEDIA', 'TERPASANG', 'RUSAK') NOT NULL DEFAULT 'TERSEDIA',
    `id_pop` INTEGER NOT NULL,
    `id_odp` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Ont_id_odp_fkey`(`id_odp` ASC),
    INDEX `Ont_id_pop_fkey`(`id_pop` ASC),
    UNIQUE INDEX `Ont_serial_number_key`(`serial_number` ASC),
    PRIMARY KEY (`id_ont` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paket` (
    `id_paket` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_paket` VARCHAR(191) NOT NULL,
    `nama_paket` VARCHAR(191) NOT NULL,
    `kecepatan` VARCHAR(191) NOT NULL,
    `harga` DECIMAL(12, 2) NOT NULL,
    `keterangan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Paket_kode_paket_key`(`kode_paket` ASC),
    PRIMARY KEY (`id_paket` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pop` (
    `id_pop` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_pop` VARCHAR(191) NOT NULL,
    `nama_pop` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(65, 30) NOT NULL,
    `longitude` DECIMAL(65, 30) NOT NULL,
    `id_area` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Pop_id_area_fkey`(`id_area` ASC),
    UNIQUE INDEX `Pop_kode_pop_key`(`kode_pop` ASC),
    PRIMARY KEY (`id_pop` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portpon` (
    `id_port` INTEGER NOT NULL AUTO_INCREMENT,
    `nomor_port` INTEGER NOT NULL,
    `tipe_kartu` VARCHAR(191) NOT NULL,
    `status` ENUM('TERSEDIA', 'TERPASANG', 'RUSAK') NOT NULL DEFAULT 'TERSEDIA',
    `id_olt` INTEGER NOT NULL,
    `id_odp` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PortPon_id_odp_fkey`(`id_odp` ASC),
    UNIQUE INDEX `PortPon_id_olt_nomor_port_key`(`id_olt` ASC, `nomor_port` ASC),
    PRIMARY KEY (`id_port` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id_setting` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key` ASC),
    PRIMARY KEY (`id_setting` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id_user` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_user` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `foto` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'LEADER', 'SALES', 'TEKNISI', 'LOGISTIK') NOT NULL,
    `no_hp` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `jkl` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL,

    UNIQUE INDEX `users_email_key`(`email` ASC),
    UNIQUE INDEX `users_kode_user_key`(`kode_user` ASC),
    UNIQUE INDEX `users_username_key`(`username` ASC),
    PRIMARY KEY (`id_user` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `baa` ADD CONSTRAINT `Baa_id_fab_fkey` FOREIGN KEY (`id_fab`) REFERENCES `fab`(`id_fab`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `baa` ADD CONSTRAINT `Baa_id_odp_fkey` FOREIGN KEY (`id_odp`) REFERENCES `odp`(`id_odp`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `baa` ADD CONSTRAINT `Baa_id_olt_fkey` FOREIGN KEY (`id_olt`) REFERENCES `olt`(`id_olt`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `baa` ADD CONSTRAINT `Baa_id_ont_fkey` FOREIGN KEY (`id_ont`) REFERENCES `ont`(`id_ont`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `baa` ADD CONSTRAINT `Baa_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `baa_teknisi` ADD CONSTRAINT `BaaTeknisi_id_baa_fkey` FOREIGN KEY (`id_baa`) REFERENCES `baa`(`id_baa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `baa_teknisi` ADD CONSTRAINT `BaaTeknisi_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `baadetail` ADD CONSTRAINT `BaaDetail_id_baa_fkey` FOREIGN KEY (`id_baa`) REFERENCES `baa`(`id_baa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `baadetail` ADD CONSTRAINT `BaaDetail_id_material_fkey` FOREIGN KEY (`id_material`) REFERENCES `material`(`id_material`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fab` ADD CONSTRAINT `Fab_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `area`(`id_area`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fab` ADD CONSTRAINT `Fab_id_paket_fkey` FOREIGN KEY (`id_paket`) REFERENCES `paket`(`id_paket`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fab` ADD CONSTRAINT `Fab_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `odp` ADD CONSTRAINT `Odp_id_olt_fkey` FOREIGN KEY (`id_olt`) REFERENCES `olt`(`id_olt`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `olt` ADD CONSTRAINT `Olt_id_pop_fkey` FOREIGN KEY (`id_pop`) REFERENCES `pop`(`id_pop`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ont` ADD CONSTRAINT `Ont_id_odp_fkey` FOREIGN KEY (`id_odp`) REFERENCES `odp`(`id_odp`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ont` ADD CONSTRAINT `Ont_id_pop_fkey` FOREIGN KEY (`id_pop`) REFERENCES `pop`(`id_pop`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pop` ADD CONSTRAINT `Pop_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `area`(`id_area`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `portpon` ADD CONSTRAINT `PortPon_id_odp_fkey` FOREIGN KEY (`id_odp`) REFERENCES `odp`(`id_odp`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `portpon` ADD CONSTRAINT `PortPon_id_olt_fkey` FOREIGN KEY (`id_olt`) REFERENCES `olt`(`id_olt`) ON DELETE RESTRICT ON UPDATE CASCADE;

