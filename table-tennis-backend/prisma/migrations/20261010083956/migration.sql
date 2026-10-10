/*
  Warnings:

  - You are about to drop the column `emailVerificationExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_emailVerificationToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationExpiry",
DROP COLUMN "emailVerificationToken",
DROP COLUMN "emailVerified";
