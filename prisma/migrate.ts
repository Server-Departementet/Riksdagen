import { Artist, PrismaClient } from "../src/prisma/client";
// This json file is not provided. I made it with a little script that fetches the data from the database directly and serves as http bodies and a large json file
import trackPlays from "../../PostgresMigrate/trackPlays.json" with { type: "json" };

const prisma = new PrismaClient();

const port = 2500;
const host = "localhost";
const apiUrl = `http://${host}:${port}`;

const albumData = await (await fetch(apiUrl + "/albums")).json();
const artistData = await (await fetch(apiUrl + "/artists")).json();
const genreData = await (await fetch(apiUrl + "/genres")).json();
const trackData = await (await fetch(apiUrl + "/tracks")).json();
const trackPlayData = trackPlays as unknown[];

// Create basic entities
await prisma.$transaction([
  prisma.genre.createMany({
    data: genreData.map(g => {
      const { artists, ...data } = g;
      return data;
    }),
    skipDuplicates: true,
  }),
  prisma.artist.createMany({
    data: artistData.map(a => {
      const { tracks, genres, ...data } = a;
      return data;
    }),
    skipDuplicates: true,
  }),
  prisma.album.createMany({
    data: albumData.map(a => {
      const { tracks, ...data } = a;
      return data;
    }),
    skipDuplicates: true,
  }),
  prisma.track.createMany({
    data: trackData.map(t => {
      const { album, artists, ...data } = t;
      return data;
    }),
    skipDuplicates: true,
  }),
  prisma.trackPlay.createMany({
    data: trackPlayData.map((tp: any) => {
      const { track, ...data } = tp;
      return data;
    }),
    skipDuplicates: true,
  }),
]);

// Link after initial creation
await prisma.$transaction([
  ...artistData.map((artist: any) =>
    prisma.artist.update({
      where: { id: artist.id },
      data: {
        tracks: {
          connect: artist.tracks.map((t: any) => ({ id: t.id })) || [],
        },
        genres: {
          connect: artist.genres.map((g: any) => ({ name: g.name })) || [],
        },
      },
    })
  ),
  ...albumData.map((album: any) =>
    prisma.album.update({
      where: { id: album.id },
      data: {
        tracks: {
          connect: album.tracks.map((t: any) => ({ id: t.id })) || [],
        },
      },
    })
  ),
  ...trackData.map((track: any) =>
    prisma.track.update({
      where: { id: track.id },
      data: {
        album: {
          connect: { id: track.album.id },
        },
        artists: {
          connect: track.artists.map((a: any) => ({ id: a.id })) || [],
        },
      },
    })
  ),
  ...trackPlayData.map((tp: any) =>
    prisma.trackPlay.update({
      where: { id: tp.id },
      data: {
        track: {
          connect: { id: tp.track.id },
        },
      },
    })
  ),
]);