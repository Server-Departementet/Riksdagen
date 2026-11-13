-- CreateTable
CREATE TABLE `FurnitureSet` (
    `ownerId` VARCHAR(191) NOT NULL,
    `items` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`ownerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FurnitureSet` ADD CONSTRAINT `FurnitureSet_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
