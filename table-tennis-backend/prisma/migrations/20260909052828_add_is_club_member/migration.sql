/*
  Warnings:

  - You are about to drop the column `address` on the `PlayerProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlayerProfile" DROP COLUMN "address",
ADD COLUMN     "isClubMember" BOOLEAN NOT NULL DEFAULT false;
