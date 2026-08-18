-- CreateTable
CREATE TABLE `Quote` (
    `id` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `createdTimestamp` BIGINT NOT NULL,
    `link` VARCHAR(191) NOT NULL,
    `originalLink` VARCHAR(191) NULL,
    `sender` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `quotee` VARCHAR(191) NOT NULL,
    `quoteeId` VARCHAR(191) NULL,
    `context` TEXT NULL,
    `attachments` JSON NULL,

    INDEX `Quote_createdTimestamp_idx`(`createdTimestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
