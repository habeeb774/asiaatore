/*
  Warnings:

  - You are about to drop the `storesetting` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `storesetting`;

-- CreateTable
CREATE TABLE `StoreSetting` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `siteNameAr` VARCHAR(191) NULL,
    `siteNameEn` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `colorPrimary` VARCHAR(191) NULL,
    `colorSecondary` VARCHAR(191) NULL,
    `colorAccent` VARCHAR(191) NULL,
    `taxNumber` VARCHAR(191) NULL,
    `supportPhone` VARCHAR(191) NULL,
    `supportMobile` VARCHAR(191) NULL,
    `supportWhatsapp` VARCHAR(191) NULL,
    `supportEmail` VARCHAR(191) NULL,
    `supportHours` VARCHAR(191) NULL,
    `footerAboutAr` VARCHAR(191) NULL,
    `footerAboutEn` VARCHAR(191) NULL,
    `linkBlog` VARCHAR(191) NULL,
    `linkSocial` VARCHAR(191) NULL,
    `linkReturns` VARCHAR(191) NULL,
    `linkPrivacy` VARCHAR(191) NULL,
    `appStoreUrl` VARCHAR(191) NULL,
    `playStoreUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
