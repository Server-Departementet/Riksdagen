/*
  Warnings:

  - The primary key for the `TrackPlay` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TrackPlay` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Album` ADD COLUMN `color` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Artist` ADD COLUMN `color` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Track` ADD COLUMN `color` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `TrackPlay` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`trackId`, `playedAt`, `userId`);

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `clerkDevId` VARCHAR(191) NULL,
    `clerkProdId` VARCHAR(191) NULL,

    UNIQUE INDEX `User_clerkDevId_key`(`clerkDevId`),
    UNIQUE INDEX `User_clerkProdId_key`(`clerkProdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Alter user table to make name and clerk ids optional
-- ALTER TABLE `User`
--     MODIFY COLUMN `name` VARCHAR(191) NULL,
--     MODIFY COLUMN `clerkDevId` VARCHAR(191) NULL,
--     MODIFY COLUMN `clerkProdId` VARCHAR(191) NULL;

-- Create a user for each userId
INSERT INTO `User` (`id`)
SELECT DISTINCT `userId` FROM `TrackPlay` tp
WHERE NOT EXISTS (
    SELECT 1 FROM `User` u WHERE u.`id` = tp.`userId`
);

-- AddForeignKey
ALTER TABLE `TrackPlay` ADD CONSTRAINT `TrackPlay_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
