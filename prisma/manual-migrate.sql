-- add releaseDate to Album table
ALTER TABLE Album
ADD COLUMN releaseDate DATE NULL;


-- Drop ISRC from Track table
ALTER TABLE Track
DROP COLUMN ISRC;
-- Add ISRC to Track table
ALTER TABLE Track
ADD COLUMN ISRC VARCHAR(192) NULL;


-- Discord OAuth migration: drop Clerk columns, add SpotifyAccount
ALTER TABLE User
DROP COLUMN clerkDevId,
DROP COLUMN clerkProdId;
CREATE TABLE SpotifyAccount (
  userId VARCHAR(191) NOT NULL,
  refreshToken TEXT NOT NULL,
  scope VARCHAR(191) NULL,
  connectedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  PRIMARY KEY (userId),
  CONSTRAINT SpotifyAccount_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE
);


-- Takeout import: mark plays that came from a historic import
ALTER TABLE TrackPlay
ADD COLUMN imported BOOLEAN NOT NULL DEFAULT false;