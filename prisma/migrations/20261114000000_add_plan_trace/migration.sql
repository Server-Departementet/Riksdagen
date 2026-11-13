-- CreateTable
CREATE TABLE `PlanTrace` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `listingUrl` TEXT NULL,
    `step` INTEGER NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `costCents` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,

    INDEX `PlanTrace_ownerId_createdAt_idx`(`ownerId`, `createdAt`),
    INDEX `PlanTrace_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PlanTrace` ADD CONSTRAINT `PlanTrace_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
