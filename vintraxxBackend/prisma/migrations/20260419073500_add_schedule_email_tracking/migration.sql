-- Track schedule request email-send outcome separately from the overall
-- appointment status. Allows persist-first + fire-and-forget email flow.
ALTER TABLE "ServiceAppointment" ADD COLUMN "adminEmailSentAt" TIMESTAMP(3);
ALTER TABLE "ServiceAppointment" ADD COLUMN "userEmailSentAt"  TIMESTAMP(3);
ALTER TABLE "ServiceAppointment" ADD COLUMN "emailLastError"   TEXT;
ALTER TABLE "ServiceAppointment" ADD COLUMN "emailAttempts"    INTEGER NOT NULL DEFAULT 0;
