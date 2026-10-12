-- Promote existing users marked as super admins after the new enum value
-- has been committed by the preceding migration.
UPDATE "User"
SET "role" = 'SUPER_ADMIN'
WHERE "isSuperAdmin" = true;
