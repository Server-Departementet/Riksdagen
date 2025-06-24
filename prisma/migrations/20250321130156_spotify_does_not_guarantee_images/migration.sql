-- AlterTable
ALTER TABLE "Album" ALTER COLUMN "image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Artist" ALTER COLUMN "image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Track" ALTER COLUMN "image" DROP NOT NULL;
