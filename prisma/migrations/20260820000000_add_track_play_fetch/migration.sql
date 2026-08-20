-- CreateTable
CREATE TABLE `TrackPlayFetch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `runAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `inserted` INTEGER NOT NULL DEFAULT 0,
    `skipped` INTEGER NOT NULL DEFAULT 0,
    `detail` TEXT NULL,

    INDEX `TrackPlayFetch_runAt_idx`(`runAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TrackPlayFetch` ADD CONSTRAINT `TrackPlayFetch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
