-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('user', 'admin', 'seller', 'delivery', 'developer') NOT NULL DEFAULT 'user';
