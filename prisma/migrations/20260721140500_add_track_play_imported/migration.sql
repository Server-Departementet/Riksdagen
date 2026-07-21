-- AlterTable
-- IF NOT EXISTS (MariaDB extension) because riksdagen_staging received this
-- column manually before the migration history existed
ALTER TABLE `TrackPlay` ADD COLUMN IF NOT EXISTS `imported` BOOLEAN NOT NULL DEFAULT false;
