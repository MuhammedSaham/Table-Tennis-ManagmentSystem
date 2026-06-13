-- AlterTable
ALTER TABLE "GroupMatch" ADD COLUMN     "bestOf" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "player1Score" INTEGER,
ADD COLUMN     "player2Score" INTEGER;
