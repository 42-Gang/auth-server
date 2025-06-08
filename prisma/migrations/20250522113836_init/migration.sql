/*
  Warnings:

  - The values [google] on the enum `user_oauth_provider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `user_oauth` MODIFY `provider` ENUM('GOOGLE') NOT NULL;
