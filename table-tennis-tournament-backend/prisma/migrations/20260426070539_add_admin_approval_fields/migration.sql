-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminApprovedAt" TIMESTAMP(3),
ADD COLUMN     "adminApprovedBy" TEXT,
ADD COLUMN     "adminRejectionReason" TEXT,
ADD COLUMN     "adminRequestStatus" TEXT DEFAULT 'NONE',
ADD COLUMN     "adminRequestedAt" TIMESTAMP(3);
