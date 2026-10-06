/*
  Warnings:

  - A unique constraint covering the columns `[registrationId,playerId]` on the table `TournamentPaymentProof` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TournamentPaymentProof_registrationId_key";

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPaymentProof_registrationId_playerId_key" ON "TournamentPaymentProof"("registrationId", "playerId");
