-- Add proper FK constraints from Appraisal.userId and Inspection.userId
-- to User.id with ON DELETE CASCADE. Closes a bug where deleting a dealer
-- left these tables orphaned (no DB-level guarantee tied them to the user).
--
-- Pre-condition: orphan rows have already been cleaned by application code
-- (see deleteUser cascade in admin.service.ts) and a one-time row purge.
-- If this migration ever fails on existing data, run:
--   DELETE FROM "Appraisal"  WHERE "userId" NOT IN (SELECT id FROM "User");
--   DELETE FROM "Inspection" WHERE "userId" NOT IN (SELECT id FROM "User");
-- before retrying.

ALTER TABLE "Appraisal"
    ADD CONSTRAINT "Appraisal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Inspection"
    ADD CONSTRAINT "Inspection_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
