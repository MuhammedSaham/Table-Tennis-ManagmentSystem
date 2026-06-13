/*
  Warnings:

  - You are about to drop the column `game2Player1` on the `GroupMatch` table. All the data in the column will be lost.
  - You are about to drop the column `game2Player2` on the `GroupMatch` table. All the data in the column will be lost.
  - You are about to drop the column `game3Player1` on the `GroupMatch` table. All the data in the column will be lost.
  - You are about to drop the column `game3Player2` on the `GroupMatch` table. All the data in the column will be lost.
  - You are about to drop the column `game4Player1` on the `GroupMatch` table. All the data in the column will be lost.
  - You are about to drop the column `game4Player2` on the `GroupMatch` table. All the data in the column will be lost.
  - You are about to drop the column `game5Player1` on the `GroupMatch` table. All the data in the column will be lost.
  - You are about to drop the column `game5Player2` on the `GroupMatch` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GroupMatch" DROP COLUMN "game2Player1",
DROP COLUMN "game2Player2",
DROP COLUMN "game3Player1",
DROP COLUMN "game3Player2",
DROP COLUMN "game4Player1",
DROP COLUMN "game4Player2",
DROP COLUMN "game5Player1",
DROP COLUMN "game5Player2",
ADD COLUMN     "game2player1" INTEGER,
ADD COLUMN     "game2player2" INTEGER,
ADD COLUMN     "game3player1" INTEGER,
ADD COLUMN     "game3player2" INTEGER,
ADD COLUMN     "game4player1" INTEGER,
ADD COLUMN     "game4player2" INTEGER,
ADD COLUMN     "game5player1" INTEGER,
ADD COLUMN     "game5player2" INTEGER;
