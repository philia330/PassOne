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

    UNIQUE INDEX `users_kode_user_key`(`kode_user`),
    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Area` (
    `id_area` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_area` VARCHAR(191) NOT NULL,
    `nama_area` VARCHAR(191) NOT NULL,
    `keterangan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Area_kode_area_key`(`kode_area`),
    PRIMARY KEY (`id_area`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pop` (
    `id_pop` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_pop` VARCHAR(191) NOT NULL,
    `nama_pop` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(65, 30) NOT NULL,
    `longitude` DECIMAL(65, 30) NOT NULL,
    `id_area` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Pop_kode_pop_key`(`kode_pop`),
    PRIMARY KEY (`id_pop`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Olt` (
    `id_olt` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_olt` VARCHAR(191) NOT NULL,
    `nama_olt` VARCHAR(191) NOT NULL,
    `lokasi` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(65, 30) NOT NULL,
    `longitude` DECIMAL(65, 30) NOT NULL,
    `id_pop` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Olt_kode_olt_key`(`kode_olt`),
    PRIMARY KEY (`id_olt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Odp` (
    `id_odp` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_odp` VARCHAR(191) NOT NULL,
    `nama_odp` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(65, 30) NOT NULL,
    `longitude` DECIMAL(65, 30) NOT NULL,
    `id_olt` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Odp_kode_odp_key`(`kode_odp`),
    PRIMARY KEY (`id_odp`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ont` (
    `id_ont` INTEGER NOT NULL AUTO_INCREMENT,
    `serial_number` VARCHAR(191) NOT NULL,
    `pelanggan` VARCHAR(191) NOT NULL,
    `status` ENUM('TERSEDIA', 'TERPASANG', 'RUSAK') NOT NULL DEFAULT 'TERSEDIA',
    `id_pop` INTEGER NOT NULL,
    `id_odp` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Ont_serial_number_key`(`serial_number`),
    PRIMARY KEY (`id_ont`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Paket` (
    `id_paket` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_paket` VARCHAR(191) NOT NULL,
    `nama_paket` VARCHAR(191) NOT NULL,
    `kecepatan` VARCHAR(191) NOT NULL,
    `harga` DECIMAL(12, 2) NOT NULL,
    `keterangan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Paket_kode_paket_key`(`kode_paket`),
    PRIMARY KEY (`id_paket`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
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

    UNIQUE INDEX `Material_kode_material_key`(`kode_material`),
    PRIMARY KEY (`id_material`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Fab` (
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

    UNIQUE INDEX `Fab_kode_fab_key`(`kode_fab`),
    UNIQUE INDEX `Fab_nik_key`(`nik`),
    PRIMARY KEY (`id_fab`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Baa` (
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

    UNIQUE INDEX `Baa_kode_baa_key`(`kode_baa`),
    PRIMARY KEY (`id_baa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaaDetail` (
    `id_baa_detail` INTEGER NOT NULL AUTO_INCREMENT,
    `id_baa` INTEGER NOT NULL,
    `id_material` INTEGER NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `keterangan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_baa_detail`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pop` ADD CONSTRAINT `Pop_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `Area`(`id_area`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Olt` ADD CONSTRAINT `Olt_id_pop_fkey` FOREIGN KEY (`id_pop`) REFERENCES `Pop`(`id_pop`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Odp` ADD CONSTRAINT `Odp_id_olt_fkey` FOREIGN KEY (`id_olt`) REFERENCES `Olt`(`id_olt`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ont` ADD CONSTRAINT `Ont_id_pop_fkey` FOREIGN KEY (`id_pop`) REFERENCES `Pop`(`id_pop`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ont` ADD CONSTRAINT `Ont_id_odp_fkey` FOREIGN KEY (`id_odp`) REFERENCES `Odp`(`id_odp`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fab` ADD CONSTRAINT `Fab_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `Area`(`id_area`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fab` ADD CONSTRAINT `Fab_id_paket_fkey` FOREIGN KEY (`id_paket`) REFERENCES `Paket`(`id_paket`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fab` ADD CONSTRAINT `Fab_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baa` ADD CONSTRAINT `Baa_id_fab_fkey` FOREIGN KEY (`id_fab`) REFERENCES `Fab`(`id_fab`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baa` ADD CONSTRAINT `Baa_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baa` ADD CONSTRAINT `Baa_id_olt_fkey` FOREIGN KEY (`id_olt`) REFERENCES `Olt`(`id_olt`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Baa` ADD CONSTRAINT `Baa_id_ont_fkey` FOREIGN KEY (`id_ont`) REFERENCES `Ont`(`id_ont`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BaaDetail` ADD CONSTRAINT `BaaDetail_id_baa_fkey` FOREIGN KEY (`id_baa`) REFERENCES `Baa`(`id_baa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BaaDetail` ADD CONSTRAINT `BaaDetail_id_material_fkey` FOREIGN KEY (`id_material`) REFERENCES `Material`(`id_material`) ON DELETE RESTRICT ON UPDATE CASCADE;
