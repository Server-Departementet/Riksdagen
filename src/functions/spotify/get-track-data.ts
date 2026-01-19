"use server";

import { prisma } from "@/lib/prisma";
import { TrackWithCompany } from "@/types";

const sqlJoin = (arr: string[], sep = ",") => arr.map(item => `'${item}'`).join(sep);

export async function getTrackDataBatch(ISRCs: string[]) {
  "use cache";

  const tracks: TrackWithCompany[] = [];
  await prisma.$transaction(async (prisma) => {
    for (const ISRC of ISRCs) {
      // Get all tracks with the given ISRC and merge
      const track = await prisma.track.aggregate({
      });
    }
  });


  // const tracks = await prisma.track.findMany({
  //   where: { id: { in: trackIds,  } },
  //   include: {
  //     album: true,
  //     artists: true,
  //   },

  // });

  return prisma.$executeRaw`
      -- SELECT 
      --   t.id, 
      --   t.name, 
      --   t.ISRC
      -- FROM Track t
      -- LEFT JOIN Album a ON t.albumId = a.id
      -- -- WHERE t.id IN (${sqlJoin(ISRCs)})
      -- WHERE t.id IN ('4gB8GGG4iH8kdf4jeFt3zO', '6v9igFlAVg32aCAn8zk9u4', '5tY9a9UshqFjvT54mKA0mV', '5tpxtELOchf4ihmTeCnzCd', '1oAOrwWGXVIiMz7z27IqLu', '6eIzQCYExfnNeM7KOlE3lE', '3E71tALpUkcQeWgfrdtT4I', '2gThkoApt6B7ajBWZRLAVv', '5pLMMDmzy936x73YhZHyfJ', '3My3bIQ9QSKhOGlZOUf1G6', '5yMJDUSbBz4hMpg9x2YsfP', '4KFBsR2eyslSWsWuYSPZDD')
      -- GROUP BY t.ISRC
      -- ;

      SELECT id, name, ISRC
      FROM (
        SELECT
          t.id,
          t.name,
          t.ISRC,
          ROW_NUMBER() OVER (
            PARTITION BY t.ISRC
            ORDER BY a.releaseDate DESC
          ) AS rn
        FROM Track t
        JOIN Album a ON t.albumId = a.id
        WHERE t.id IN (
          '4gB8GGG4iH8kdf4jeFt3zO', '6v9igFlAVg32aCAn8zk9u4', '5tY9a9UshqFjvT54mKA0mV', '5tpxtELOchf4ihmTeCnzCd', '1oAOrwWGXVIiMz7z27IqLu', '6eIzQCYExfnNeM7KOlE3lE', '3E71tALpUkcQeWgfrdtT4I', '2gThkoApt6B7ajBWZRLAVv', '5pLMMDmzy936x73YhZHyfJ', '3My3bIQ9QSKhOGlZOUf1G6', '5yMJDUSbBz4hMpg9x2YsfP', '4KFBsR2eyslSWsWuYSPZDD'
        )
      ) x
      WHERE rn = 1
      ;

      -- Get all tracks with non unique ISRCs
      SELECT t.id, t.name, t.ISRC, count(t.ISRC) as isrc_count
      FROM Track t
      JOIN Album a ON t.albumId = a.id
      WHERE t.ISRC IN (
        SELECT ISRC
        FROM Track
        GROUP BY ISRC
        HAVING COUNT(*) > 1
      )
      GROUP BY t.ISRC
      ORDER BY isrc_count DESC
      ;
  `;
}