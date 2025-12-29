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
    `name` VARCHAR(191) NOT NULL,
    `clerkDevId` VARCHAR(191) NOT NULL,
    `clerkProdId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_clerkDevId_key`(`clerkDevId`),
    UNIQUE INDEX `User_clerkProdId_key`(`clerkProdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TrackPlay` ADD CONSTRAINT `TrackPlay_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
