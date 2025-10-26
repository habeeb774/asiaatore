-- AlterTable
ALTER TABLE `StoreSetting` ADD COLUMN `heroAutoplayInterval` INTEGER NULL,
    ADD COLUMN `heroBackgroundGradient` VARCHAR(191) NULL,
    ADD COLUMN `heroBackgroundImage` VARCHAR(191) NULL,
    ADD COLUMN `heroCenterImage` VARCHAR(191) NULL,
    ADD COLUMN `topStripAutoscroll` BOOLEAN NULL DEFAULT true,
    ADD COLUMN `topStripBackground` VARCHAR(191) NULL,
    ADD COLUMN `topStripEnabled` BOOLEAN NULL DEFAULT true;
