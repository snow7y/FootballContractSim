-- CreateTable
CREATE TABLE `GameplayPhaseState` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `phaseId` VARCHAR(191) NOT NULL,
    `phaseLabel` VARCHAR(191) NOT NULL,
    `stepIndex` INTEGER NOT NULL,
    `totalSteps` INTEGER NOT NULL,
    `status` ENUM('NotStarted', 'InProgress', 'Completed') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GameplayPhaseState_userId_phaseId_key`(`userId`, `phaseId`),
    INDEX `GameplayPhaseState_userId_idx`(`userId`),
    INDEX `GameplayPhaseState_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Goal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('Active', 'Completed', 'Expired', 'Disabled') NOT NULL,
    `reason` VARCHAR(191) NULL,
    `progressLabel` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Goal_userId_idx`(`userId`),
    INDEX `Goal_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActionLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `actionType` ENUM('ContractCreated', 'UserSelected', 'UserCreated', 'ContractFailed', 'PhaseUpdated') NOT NULL,
    `status` ENUM('Success', 'Failure', 'Pending') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `hint` VARCHAR(191) NULL,
    `deltaHighlights` JSON NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActionLog_userId_idx`(`userId`),
    INDEX `ActionLog_occurredAt_idx`(`occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoreSnapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `contractId` INTEGER NULL,
    `totalScore` INTEGER NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ScoreSnapshot_userId_idx`(`userId`),
    INDEX `ScoreSnapshot_calculatedAt_idx`(`calculatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoreMetric` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `snapshotId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `value` INTEGER NOT NULL,
    `maxValue` INTEGER NULL,
    `delta` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `missingReason` VARCHAR(191) NULL,

    INDEX `ScoreMetric_snapshotId_idx`(`snapshotId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GameplayPhaseState` ADD CONSTRAINT `GameplayPhaseState_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Goal` ADD CONSTRAINT `Goal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionLog` ADD CONSTRAINT `ActionLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreSnapshot` ADD CONSTRAINT `ScoreSnapshot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreSnapshot` ADD CONSTRAINT `ScoreSnapshot_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreMetric` ADD CONSTRAINT `ScoreMetric_snapshotId_fkey` FOREIGN KEY (`snapshotId`) REFERENCES `ScoreSnapshot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
