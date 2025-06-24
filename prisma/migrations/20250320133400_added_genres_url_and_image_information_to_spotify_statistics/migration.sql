/*
  Warnings:

  - Added the required column `image` to the `Album` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Album` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Artist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Artist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Track` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Genre" (
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "_ArtistToGenre" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtistToGenre_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ArtistToGenre_B_index" ON "_ArtistToGenre"("B");

-- AddForeignKey
ALTER TABLE "_ArtistToGenre" ADD CONSTRAINT "_ArtistToGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToGenre" ADD CONSTRAINT "_ArtistToGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "Genre"("name") ON DELETE CASCADE ON UPDATE CASCADE;
