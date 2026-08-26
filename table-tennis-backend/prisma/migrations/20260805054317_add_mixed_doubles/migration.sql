-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "CategoryType" ADD VALUE 'MIXED_DOUBLES';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DOUBLES_INVITE';
ALTER TYPE "NotificationType" ADD VALUE 'DOUBLES_INVITE_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'DOUBLES_INVITE_DECLINED';

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "winnerTeamId" TEXT;

-- AlterTable
ALTER TABLE "GroupMatch" ADD COLUMN     "refereeId" TEXT,
ADD COLUMN     "team1Id" TEXT,
ADD COLUMN     "team2Id" TEXT,
ADD COLUMN     "winnerTeamId" TEXT;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "winnerTeamId" TEXT;

-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "gender" "Gender";

-- CreateTable
CREATE TABLE "DoublesInvite" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoublesInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoublesInvite_tournamentId_categoryId_inviterId_key" ON "DoublesInvite"("tournamentId", "categoryId", "inviterId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoublesInvite" ADD CONSTRAINT "DoublesInvite_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoublesInvite" ADD CONSTRAINT "DoublesInvite_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoublesInvite" ADD CONSTRAINT "DoublesInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoublesInvite" ADD CONSTRAINT "DoublesInvite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoublesInvite" ADD CONSTRAINT "DoublesInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMatch" ADD CONSTRAINT "GroupMatch_team1Id_fkey" FOREIGN KEY ("team1Id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMatch" ADD CONSTRAINT "GroupMatch_team2Id_fkey" FOREIGN KEY ("team2Id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMatch" ADD CONSTRAINT "GroupMatch_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "RefereeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
