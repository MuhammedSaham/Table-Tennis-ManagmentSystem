-- DropIndex
DROP INDEX "TournamentPaymentProof_registrationId_playerId_key";

-- CreateTable
CREATE TABLE "PaymentVerificationHistory" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "proofId" TEXT NOT NULL,
    "status" "PaymentProofStatus" NOT NULL,
    "verifiedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentVerificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentVerificationHistory_registrationId_playerId_idx" ON "PaymentVerificationHistory"("registrationId", "playerId");

-- CreateIndex
CREATE INDEX "PaymentVerificationHistory_proofId_idx" ON "PaymentVerificationHistory"("proofId");

-- CreateIndex
CREATE INDEX "TournamentPaymentProof_registrationId_playerId_idx" ON "TournamentPaymentProof"("registrationId", "playerId");

-- AddForeignKey
ALTER TABLE "PaymentVerificationHistory" ADD CONSTRAINT "PaymentVerificationHistory_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "TournamentPaymentProof"("id") ON DELETE CASCADE ON UPDATE CASCADE;
