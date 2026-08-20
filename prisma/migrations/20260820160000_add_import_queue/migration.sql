-- CreateTable
CREATE TABLE `ImportQueueItem` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `playedAt` DATETIME(3) NOT NULL,
    `queuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reason` VARCHAR(191) NULL,

    UNIQUE INDEX `ImportQueueItem_userId_trackId_playedAt_key`(`userId`, `trackId`, `playedAt`),
    INDEX `ImportQueueItem_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ImportQueueItem` ADD CONSTRAINT `ImportQueueItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
