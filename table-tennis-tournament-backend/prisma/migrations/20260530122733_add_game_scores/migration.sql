/*
  Warnings:

  - You are about to drop the column `player1Score` on the `GroupMatch` table. All the data in the column will be lost.
  - You are about to drop the column `player2Score` on the `GroupMatch` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GroupMatch" DROP COLUMN "player1Score",
DROP COLUMN "player2Score",
ADD COLUMN     "game1player1" INTEGER,
ADD COLUMN     "game1player2" INTEGER,
ADD COLUMN     "game2Player1" INTEGER,
ADD COLUMN     "game2Player2" INTEGER,
ADD COLUMN     "game3Player1" INTEGER,
ADD COLUMN     "game3Player2" INTEGER,
ADD COLUMN     "game4Player1" INTEGER,
ADD COLUMN     "game4Player2" INTEGER,
ADD COLUMN     "game5Player1" INTEGER,
ADD COLUMN     "game5Player2" INTEGER;
