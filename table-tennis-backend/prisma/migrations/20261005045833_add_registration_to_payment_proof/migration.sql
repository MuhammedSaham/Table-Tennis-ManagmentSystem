/*
  Warnings:

  - A unique constraint covering the columns `[registrationId]` on the table `TournamentPaymentProof` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TournamentPaymentProof" ADD COLUMN     "registrationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPaymentProof_registrationId_key" ON "TournamentPaymentProof"("registrationId");

-- AddForeignKey
ALTER TABLE "TournamentPaymentProof" ADD CONSTRAINT "TournamentPaymentProof_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "TournamentRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
