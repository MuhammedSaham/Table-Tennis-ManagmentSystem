-- CreateTable
CREATE TABLE "RegistrationPaymentVerification" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "proofId" TEXT,
    "status" "PaymentProofStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationPaymentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistrationPaymentVerification_playerId_idx" ON "RegistrationPaymentVerification"("playerId");

-- CreateIndex
CREATE INDEX "RegistrationPaymentVerification_proofId_idx" ON "RegistrationPaymentVerification"("proofId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationPaymentVerification_registrationId_playerId_key" ON "RegistrationPaymentVerification"("registrationId", "playerId");

-- AddForeignKey
ALTER TABLE "RegistrationPaymentVerification" ADD CONSTRAINT "RegistrationPaymentVerification_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "TournamentRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationPaymentVerification" ADD CONSTRAINT "RegistrationPaymentVerification_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "TournamentPaymentProof"("id") ON DELETE SET NULL ON UPDATE CASCADE;

