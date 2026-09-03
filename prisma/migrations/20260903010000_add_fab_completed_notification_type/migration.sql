-- Add a distinct notification type for completed FAB installations.
ALTER TABLE `notification`
  MODIFY COLUMN `type` ENUM(
    'FAB_OPEN',
    'FAB_ASSIGNED',
    'FAB_STATUS_CHANGE',
    'BAA_CREATED',
    'FAB_COMPLETED',
    'SYSTEM'
  ) NOT NULL DEFAULT 'SYSTEM';
