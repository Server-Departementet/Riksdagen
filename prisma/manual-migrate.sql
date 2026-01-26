-- add releaseDate to Album table
ALTER TABLE Album
ADD COLUMN releaseDate DATE NULL;


-- Drop ISRC from Track table
ALTER TABLE Track
DROP COLUMN ISRC;
-- Add ISRC to Track table
ALTER TABLE Track
ADD COLUMN ISRC VARCHAR(192) NULL;