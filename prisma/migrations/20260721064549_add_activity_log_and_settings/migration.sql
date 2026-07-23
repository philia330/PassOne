-- CreateTable
CREATE TABLE `activity_logs` (
    `id_log` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('USER_CREATED', 'USER_UPDATED', 'FAB_CREATED', 'BAA_CREATED', 'MATERIAL_UPDATED', 'LOGIN') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `id_user` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_log`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id_setting` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    PRIMARY KEY (`id_setting`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
