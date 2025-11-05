-- AlterTable
ALTER TABLE `StoreSetting` ADD COLUMN `addressAr` VARCHAR(191) NULL,
    ADD COLUMN `addressEn` VARCHAR(191) NULL,
    ADD COLUMN `aramexApiKey` VARCHAR(191) NULL,
    ADD COLUMN `aramexApiPass` VARCHAR(191) NULL,
    ADD COLUMN `aramexApiUrl` VARCHAR(191) NULL,
    ADD COLUMN `aramexApiUser` VARCHAR(191) NULL,
    ADD COLUMN `aramexEnabled` BOOLEAN NULL,
    ADD COLUMN `aramexWebhookSecret` VARCHAR(191) NULL,
    ADD COLUMN `commercialRegNo` VARCHAR(191) NULL,
    ADD COLUMN `companyNameAr` VARCHAR(191) NULL,
    ADD COLUMN `companyNameEn` VARCHAR(191) NULL,
    ADD COLUMN `originLat` DOUBLE NULL,
    ADD COLUMN `originLng` DOUBLE NULL,
    ADD COLUMN `payBankEnabled` BOOLEAN NULL,
    ADD COLUMN `payCodEnabled` BOOLEAN NULL,
    ADD COLUMN `payPaypalEnabled` BOOLEAN NULL,
    ADD COLUMN `payStcEnabled` BOOLEAN NULL,
    ADD COLUMN `shippingBase` DOUBLE NULL,
    ADD COLUMN `shippingFallback` DOUBLE NULL,
    ADD COLUMN `shippingMax` DOUBLE NULL,
    ADD COLUMN `shippingMin` DOUBLE NULL,
    ADD COLUMN `shippingPerKm` DOUBLE NULL,
    ADD COLUMN `smsaApiKey` VARCHAR(191) NULL,
    ADD COLUMN `smsaApiUrl` VARCHAR(191) NULL,
    ADD COLUMN `smsaEnabled` BOOLEAN NULL,
    ADD COLUMN `smsaWebhookSecret` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Counter` (
    `name` VARCHAR(191) NOT NULL,
    `value` BIGINT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'SAR',
    `subtotal` DOUBLE NOT NULL DEFAULT 0,
    `tax` DOUBLE NOT NULL DEFAULT 0,
    `total` DOUBLE NOT NULL DEFAULT 0,
    `paymentMethod` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `issueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Invoice_orderId_idx`(`orderId`),
    INDEX `Invoice_userId_idx`(`userId`),
    INDEX `Invoice_status_idx`(`status`),
    INDEX `Invoice_createdAt_idx`(`createdAt`),
    INDEX `Invoice_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceLog` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InvoiceLog_invoiceId_idx`(`invoiceId`),
    INDEX `InvoiceLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceLog` ADD CONSTRAINT `InvoiceLog_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceLog` ADD CONSTRAINT `InvoiceLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
