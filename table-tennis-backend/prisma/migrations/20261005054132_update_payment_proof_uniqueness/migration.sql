-- DropIndex
DROP INDEX "TournamentPaymentProof_tournamentId_playerId_key";

-- CreateIndex
CREATE INDEX "TournamentPaymentProof_tournamentId_playerId_idx" ON "TournamentPaymentProof"("tournamentId", "playerId");
