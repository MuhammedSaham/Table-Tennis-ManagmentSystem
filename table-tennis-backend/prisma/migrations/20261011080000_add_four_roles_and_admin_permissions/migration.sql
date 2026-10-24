-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- CreateEnum
CREATE TYPE "AdminRequestStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('MANAGE_USERS', 'MANAGE_PLAYERS', 'MANAGE_REFEREES', 'MANAGE_TOURNAMENTS', 'MANAGE_REGISTRATIONS', 'MANAGE_MATCHES', 'MANAGE_RESULTS', 'MANAGE_RANKINGS', 'MANAGE_CLUB_MEMBERSHIPS');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "adminRequestStatus" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "adminRequestStatus" TYPE "AdminRequestStatus" USING (
  CASE 
    WHEN "adminRequestStatus" = 'PENDING' THEN 'PENDING'::"AdminRequestStatus"
    WHEN "adminRequestStatus" = 'APPROVED' THEN 'APPROVED'::"AdminRequestStatus"
    WHEN "adminRequestStatus" = 'REJECTED' THEN 'REJECTED'::"AdminRequestStatus"
    ELSE 'NONE'::"AdminRequestStatus"
  END
);
ALTER TABLE "User" ALTER COLUMN "adminRequestStatus" SET DEFAULT 'NONE'::"AdminRequestStatus";

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "Permission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminPermission_userId_idx" ON "AdminPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_userId_permission_key" ON "AdminPermission"("userId", "permission");

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

