/*
  Warnings:

  - A unique constraint covering the columns `[sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `CartItem` DROP FOREIGN KEY `CartItem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `ProductImage` DROP FOREIGN KEY `ProductImage_productId_fkey`;

-- DropForeignKey
ALTER TABLE `ProductTierPrice` DROP FOREIGN KEY `ProductTierPrice_productId_fkey`;

-- DropForeignKey
ALTER TABLE `Review` DROP FOREIGN KEY `Review_productId_fkey`;

-- DropForeignKey
ALTER TABLE `WishlistItem` DROP FOREIGN KEY `WishlistItem_productId_fkey`;

-- DropIndex
DROP INDEX `AppLink_active_idx` ON `AppLink`;

-- DropIndex
DROP INDEX `AppLink_platform_idx` ON `AppLink`;

-- DropIndex
DROP INDEX `Brand_createdAt_idx` ON `Brand`;

-- DropIndex
DROP INDEX `CartItem_userId_idx` ON `CartItem`;

-- DropIndex
DROP INDEX `MarketingBanner_active_idx` ON `MarketingBanner`;

-- DropIndex
DROP INDEX `MarketingBanner_location_idx` ON `MarketingBanner`;

-- DropIndex
DROP INDEX `MarketingBanner_sort_idx` ON `MarketingBanner`;

-- DropIndex
DROP INDEX `MarketingFeature_active_idx` ON `MarketingFeature`;

-- DropIndex
DROP INDEX `MarketingFeature_sort_idx` ON `MarketingFeature`;

-- DropIndex
DROP INDEX `Order_createdAt_idx` ON `Order`;

-- DropIndex
DROP INDEX `Order_status_idx` ON `Order`;

-- DropIndex
DROP INDEX `Product_category_idx` ON `Product`;

-- DropIndex
DROP INDEX `Product_createdAt_idx` ON `Product`;

-- DropIndex
DROP INDEX `ProductImage_sort_idx` ON `ProductImage`;

-- DropIndex
DROP INDEX `ProductTierPrice_minQty_idx` ON `ProductTierPrice`;

-- DropIndex
DROP INDEX `Review_status_idx` ON `Review`;

-- DropIndex
DROP INDEX `WishlistItem_userId_idx` ON `WishlistItem`;

-- AlterTable
ALTER TABLE `CartItem` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `acceptedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deliveredAt` DATETIME(3) NULL,
    ADD COLUMN `deliveryDriverId` VARCHAR(191) NULL,
    ADD COLUMN `deliveryDurationSec` INTEGER NULL,
    ADD COLUMN `deliveryLocation` JSON NULL,
    ADD COLUMN `deliveryStatus` VARCHAR(191) NOT NULL DEFAULT 'unassigned',
    ADD COLUMN `failedAt` DATETIME(3) NULL,
    ADD COLUMN `outForDeliveryAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `costPrice` DOUBLE NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `sku` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE `ProductImage` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ProductTierPrice` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Review` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `phoneVerifiedAt` DATETIME(3) NULL,
    MODIFY `role` ENUM('user', 'admin', 'seller', 'delivery') NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE `WishlistItem` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Ad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `image` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shipment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `trackingNumber` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'created',
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Shipment_trackingNumber_key`(`trackingNumber`),
    INDEX `Shipment_orderId_fkey`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'Yemen',
    `city` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NULL,
    `street` VARCHAR(191) NOT NULL,
    `building` VARCHAR(191) NULL,
    `apartment` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Address_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `online` BOOLEAN NOT NULL DEFAULT false,
    `vehicleType` VARCHAR(191) NULL,
    `licensePlate` VARCHAR(191) NULL,
    `lastKnownLocation` JSON NULL,
    `lastSeenAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeliveryProfile_userId_key`(`userId`),
    INDEX `DeliveryProfile_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryConfirmation` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `driverId` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `signatureUrl` VARCHAR(191) NULL,
    `otpVerifiedAt` DATETIME(3) NULL,
    `otpLast4` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DeliveryConfirmation_orderId_idx`(`orderId`),
    INDEX `DeliveryConfirmation_driverId_idx`(`driverId`),
    INDEX `DeliveryConfirmation_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryOtp` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DeliveryOtp_orderId_idx`(`orderId`),
    INDEX `DeliveryOtp_userId_idx`(`userId`),
    INDEX `DeliveryOtp_active_idx`(`active`),
    INDEX `DeliveryOtp_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatThread` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChatThread_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `fromId` VARCHAR(191) NULL,
    `fromName` VARCHAR(191) NULL,
    `text` VARCHAR(191) NOT NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatMessage_threadId_idx`(`threadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `storesetting` (
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

-- CreateTable
CREATE TABLE `Warehouse` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `capacity` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inventory` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `reservedQuantity` INTEGER NOT NULL DEFAULT 0,
    `lowStockThreshold` INTEGER NOT NULL DEFAULT 5,
    `location` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Inventory_productId_idx`(`productId`),
    INDEX `Inventory_warehouseId_idx`(`warehouseId`),
    UNIQUE INDEX `Inventory_productId_warehouseId_key`(`productId`, `warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NULL,
    `transactionType` ENUM('inbound', 'outbound', 'adjustment', 'transfer') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `previousStock` INTEGER NOT NULL,
    `newStock` INTEGER NOT NULL,
    `referenceType` ENUM('sale', 'return', 'purchase', 'adjustment', 'order') NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryTransaction_productId_createdAt_idx`(`productId`, `createdAt`),
    INDEX `InventoryTransaction_warehouseId_idx`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `refreshHash` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `lastUsedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_refreshHash_key`(`refreshHash`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NULL,
    `code` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `consumedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userAgent` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,

    INDEX `AuthToken_userId_idx`(`userId`),
    INDEX `AuthToken_type_idx`(`type`),
    INDEX `AuthToken_tokenHash_idx`(`tokenHash`),
    INDEX `AuthToken_code_idx`(`code`),
    INDEX `AuthToken_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Order_deliveryDriverId_idx` ON `Order`(`deliveryDriverId`);

-- CreateIndex
CREATE INDEX `Order_deliveryStatus_idx` ON `Order`(`deliveryStatus`);

-- CreateIndex
CREATE INDEX `Order_outForDeliveryAt_idx` ON `Order`(`outForDeliveryAt`);

-- CreateIndex
CREATE INDEX `Order_deliveredAt_idx` ON `Order`(`deliveredAt`);

-- CreateIndex
CREATE UNIQUE INDEX `Product_sku_key` ON `Product`(`sku`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shipment` ADD CONSTRAINT `Shipment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductTierPrice` ADD CONSTRAINT `ProductTierPrice_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryProfile` ADD CONSTRAINT `DeliveryProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryConfirmation` ADD CONSTRAINT `DeliveryConfirmation_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryConfirmation` ADD CONSTRAINT `DeliveryConfirmation_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryOtp` ADD CONSTRAINT `DeliveryOtp_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryOtp` ADD CONSTRAINT `DeliveryOtp_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatThread` ADD CONSTRAINT `ChatThread_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `ChatThread`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_fromId_fkey` FOREIGN KEY (`fromId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryTransaction` ADD CONSTRAINT `InventoryTransaction_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryTransaction` ADD CONSTRAINT `InventoryTransaction_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthToken` ADD CONSTRAINT `AuthToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `CartItem` RENAME INDEX `CartItem_productId_idx` TO `CartItem_productId_fkey`;

-- RenameIndex
ALTER TABLE `Order` RENAME INDEX `Order_userId_idx` TO `Order_userId_fkey`;

-- RenameIndex
ALTER TABLE `OrderItem` RENAME INDEX `OrderItem_orderId_idx` TO `OrderItem_orderId_fkey`;

-- RenameIndex
ALTER TABLE `OrderItem` RENAME INDEX `OrderItem_productId_idx` TO `OrderItem_productId_fkey`;

-- RenameIndex
ALTER TABLE `Product` RENAME INDEX `Product_brandId_idx` TO `Product_brandId_fkey`;

-- RenameIndex
ALTER TABLE `ProductImage` RENAME INDEX `ProductImage_productId_idx` TO `ProductImage_productId_fkey`;

-- RenameIndex
ALTER TABLE `Review` RENAME INDEX `Review_productId_idx` TO `Review_productId_fkey`;

-- RenameIndex
ALTER TABLE `Review` RENAME INDEX `Review_userId_idx` TO `Review_userId_fkey`;

-- RenameIndex
ALTER TABLE `WishlistItem` RENAME INDEX `WishlistItem_productId_idx` TO `WishlistItem_productId_fkey`;
