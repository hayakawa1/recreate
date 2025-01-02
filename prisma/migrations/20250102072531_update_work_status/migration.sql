/*
  Warnings:

  - The values [completed] on the enum `WorkStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WorkStatus_new" AS ENUM ('requested', 'rejected', 'delivered', 'paid');
ALTER TABLE "Work" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Work" ALTER COLUMN "status" TYPE "WorkStatus_new" USING ("status"::text::"WorkStatus_new");
ALTER TYPE "WorkStatus" RENAME TO "WorkStatus_old";
ALTER TYPE "WorkStatus_new" RENAME TO "WorkStatus";
DROP TYPE "WorkStatus_old";
ALTER TABLE "Work" ALTER COLUMN "status" SET DEFAULT 'requested';
COMMIT;
