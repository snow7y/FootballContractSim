-- CreateTable
CREATE TABLE `Player` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `position` ENUM('GK', 'RB', 'RWB', 'CB', 'LB', 'LWB', 'DM', 'CM', 'AM', 'RW', 'LW', 'ST', 'CF') NOT NULL,
    `nationality` VARCHAR(191) NULL,
    `age` INTEGER NOT NULL,
    `overall` TINYINT NOT NULL,
    `potential` TINYINT NOT NULL,
    `currentClub` VARCHAR(191) NULL,
    `contractUntil` DATETIME(3) NULL,
    `marketValue` INTEGER NULL,
    `wage` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Player_name_idx`(`name`),
    INDEX `Player_position_idx`(`position`),
    INDEX `Player_overall_idx`(`overall`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
