-- CreateEnum
CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "paymentInstructions" TEXT,
ADD COLUMN     "registrationFee" DECIMAL(65,30),
ADD COLUMN     "requirePaymentProofClub" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requirePaymentProofGuest" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TournamentPaymentProof" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "proofUrl" TEXT NOT NULL,
    "status" "PaymentProofStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "TournamentPaymentProof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPaymentProof_tournamentId_playerId_key" ON "TournamentPaymentProof"("tournamentId", "playerId");

-- AddForeignKey
ALTER TABLE "TournamentPaymentProof" ADD CONSTRAINT "TournamentPaymentProof_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPaymentProof" ADD CONSTRAINT "TournamentPaymentProof_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
