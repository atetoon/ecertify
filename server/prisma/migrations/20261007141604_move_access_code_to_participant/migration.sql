/*
  Warnings:

  - You are about to drop the column `accessCodeHash` on the `Certificate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accessCodeHash]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accessCodeHash` to the `Participant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Certificate" DROP COLUMN "accessCodeHash";

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "accessCodeHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_accessCodeHash_key" ON "Participant"("accessCodeHash");
