-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "nextMatchId" TEXT,
ADD COLUMN     "sourceMatch1Id" TEXT,
ADD COLUMN     "sourceMatch2Id" TEXT;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
