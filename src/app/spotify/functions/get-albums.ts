import { prisma } from "@/lib/prisma";
import { Album } from "../types";

/** 
 * TODO: use this
 */
export default async function getAlbums() {
  "use cache";

  const albums: Album[] = (await prisma.album.findMany({
    include: {
      _count: {
        select: { tracks: true }
      },
    }
  }))
    .map(album => ({
      id: album.id,
      name: album.name,
      image: album.image,
      url: album.url,
      trackCount: album._count.tracks,
    }));

  return albums;
}