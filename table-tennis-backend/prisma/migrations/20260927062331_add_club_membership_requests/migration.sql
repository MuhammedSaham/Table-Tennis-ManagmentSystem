-- CreateEnum
CREATE TYPE "ClubMembershipRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ClubMembershipRequest" (
    "id" TEXT NOT NULL,
    "playerProfileId" TEXT NOT NULL,
    "status" "ClubMembershipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "ClubMembershipRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubMembershipRequest_playerProfileId_key" ON "ClubMembershipRequest"("playerProfileId");

-- AddForeignKey
ALTER TABLE "ClubMembershipRequest" ADD CONSTRAINT "ClubMembershipRequest_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
