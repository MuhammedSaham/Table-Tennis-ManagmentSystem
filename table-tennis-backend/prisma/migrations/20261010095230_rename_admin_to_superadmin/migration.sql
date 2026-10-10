/*
  Warnings:

  - The values [ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `paymentInstructions` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `registrationFee` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `requirePaymentProofClub` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `requirePaymentProofGuest` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the `ClubMembershipRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TournamentPaymentProof` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPERADMIN', 'REFEREE', 'PLAYER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ClubMembershipRequest" DROP CONSTRAINT "ClubMembershipRequest_playerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentPaymentProof" DROP CONSTRAINT "TournamentPaymentProof_playerId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentPaymentProof" DROP CONSTRAINT "TournamentPaymentProof_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentPaymentProof" DROP CONSTRAINT "TournamentPaymentProof_tournamentId_fkey";

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "paymentInstructions",
DROP COLUMN "registrationFee",
DROP COLUMN "requirePaymentProofClub",
DROP COLUMN "requirePaymentProofGuest";

-- DropTable
DROP TABLE "ClubMembershipRequest";

-- DropTable
DROP TABLE "TournamentPaymentProof";

-- DropEnum
DROP TYPE "ClubMembershipRequestStatus";

-- DropEnum
DROP TYPE "PaymentProofStatus";
