-- Add notification types for administrator pending-request alerts.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CLUB_MEMBERSHIP_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_VERIFICATION_REQUEST';
