-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
