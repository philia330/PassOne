-- Remove stok_port column from odp table (now calculated dynamically from jumlah_port - count(baa))
ALTER TABLE `odp` DROP COLUMN `stok_port`;
