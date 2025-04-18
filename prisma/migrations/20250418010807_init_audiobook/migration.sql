/*
  Warnings:

  - You are about to drop the column `audioFile` on the `Audiobook` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Audiobook` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Audiobook` table without a default value. This is not possible if the table is not empty.
  - Made the column `audiobookId` on table `Transcription` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AudiobookStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- DropForeignKey
ALTER TABLE "Transcription" DROP CONSTRAINT "Transcription_audiobookId_fkey";

-- AlterTable
ALTER TABLE "Audiobook" DROP COLUMN "audioFile",
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "playCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" "AudiobookStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Transcription" ADD COLUMN     "format" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ALTER COLUMN "audiobookId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audioFile" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "trackNumber" INTEGER NOT NULL,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "audiobookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Audiobook_slug_key" ON "Audiobook"("slug");

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_audiobookId_fkey" FOREIGN KEY ("audiobookId") REFERENCES "Audiobook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcription" ADD CONSTRAINT "Transcription_audiobookId_fkey" FOREIGN KEY ("audiobookId") REFERENCES "Audiobook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
