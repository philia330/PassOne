/*
  Warnings:

  - Added the required column `id_penginput` to the `fab` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: tambah kolom nullable dulu
ALTER TABLE `fab` ADD COLUMN `id_penginput` INTEGER NULL;

-- Step 2: isi data lama — asumsikan penginput = sales yang tercatat sebelumnya
UPDATE `fab` SET `id_penginput` = `id_user`;

-- Step 3: kunci jadi NOT NULL
ALTER TABLE `fab` MODIFY COLUMN `id_penginput` INTEGER NOT NULL;

-- Step 4: tambah foreign key + index
ALTER TABLE `fab` ADD CONSTRAINT `Fab_id_penginput_fkey`
  FOREIGN KEY (`id_penginput`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX `Fab_id_penginput_fkey` ON `fab`(`id_penginput`);
