-- CreateTable
CREATE TABLE `QuizRound` (
    `number` INTEGER NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `quoteId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `options` JSON NOT NULL,
    `postedAt` DATETIME(3) NOT NULL,
    `resultMessageId` VARCHAR(191) NULL,
    `correctAnswer` VARCHAR(191) NULL,
    `closedAt` DATETIME(3) NULL,

    UNIQUE INDEX `QuizRound_messageId_key`(`messageId`),
    UNIQUE INDEX `QuizRound_resultMessageId_key`(`resultMessageId`),
    INDEX `QuizRound_quoteId_idx`(`quoteId`),
    PRIMARY KEY (`number`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizVote` (
    `roundNumber` INTEGER NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `answer` VARCHAR(191) NOT NULL,
    `correct` BOOLEAN NOT NULL,

    INDEX `QuizVote_userId_idx`(`userId`),
    PRIMARY KEY (`roundNumber`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `QuizVote` ADD CONSTRAINT `QuizVote_roundNumber_fkey` FOREIGN KEY (`roundNumber`) REFERENCES `QuizRound`(`number`) ON DELETE CASCADE ON UPDATE CASCADE;

