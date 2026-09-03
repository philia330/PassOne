-- Track who assigned a FAB so completion notifications can be targeted.
ALTER TABLE `fab`
  ADD COLUMN `id_penugas` INTEGER NULL,
  ADD INDEX `Fab_id_penugas_idx` (`id_penugas`),
  ADD CONSTRAINT `Fab_id_penugas_fkey`
    FOREIGN KEY (`id_penugas`) REFERENCES `users`(`id_user`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Link completion notifications to their BAA for idempotent retries.
ALTER TABLE `notification`
  ADD COLUMN `id_baa` INTEGER NULL,
  ADD INDEX `Notification_id_baa_idx` (`id_baa`),
  ADD UNIQUE INDEX `Notification_id_baa_type_key` (`id_baa`, `type`),
  ADD CONSTRAINT `Notification_id_baa_fkey`
    FOREIGN KEY (`id_baa`) REFERENCES `baa`(`id_baa`)
    ON DELETE SET NULL ON UPDATE CASCADE;
