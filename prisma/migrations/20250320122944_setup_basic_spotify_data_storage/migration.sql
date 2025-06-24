-- CreateTable
CREATE TABLE "TrackPlay" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackPlay_pkey" PRIMARY KEY ("id")
);
