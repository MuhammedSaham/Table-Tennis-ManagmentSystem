-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "ranking" INTEGER,
ADD COLUMN     "rankingNote" TEXT,
ADD COLUMN     "rankingUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "rankingUpdatedBy" TEXT;
