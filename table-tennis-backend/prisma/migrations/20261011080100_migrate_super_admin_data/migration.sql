-- Data Migration: Update existing Super Admin users to SUPER_ADMIN role
UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "isSuperAdmin" = true;

