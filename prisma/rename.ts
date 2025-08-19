// import { createHash } from "node:crypto";
// import { PrismaClient } from "../src/prisma/client";
// import usermap from "./usermap.json" with { type: "json" };
// import fs from "node:fs";

// function generateDeterministicId(userId: string, trackId: string, playedAt: string): string {
//   const uniqueString = `${userId}:${trackId}:${playedAt}`;
//   return createHash("md5").update(uniqueString).digest("hex");
// }

// const prisma = new PrismaClient();

// // const trackPlays = await prisma.trackPlay.findMany({
// //   include: {
// //     track: {
// //       select: { id: true }
// //     },
// //   },
// // });
// const trackPlays: any[] = JSON.parse(fs.readFileSync("prisma/trackPlaysDump.json", "utf-8"));
// console.log(trackPlays.length, "track plays found");
// // Make backup to file
// // fs.writeFileSync("prisma/trackPlaysDump.json", JSON.stringify(trackPlays));

// const renamedPlays: ({
// } & {
//   id: string;
//   trackId: string;
//   playedAt: Date;
//   userId: string;
// })[] = trackPlays.map((play) => {
//   if (!usermap[play.userId as keyof typeof usermap]) {
//     throw new Error(`User ${play.userId} not found in usermap`);
//   }
//   const newUserId = usermap[play.userId as keyof typeof usermap].prod;
//   const newId = generateDeterministicId(newUserId, play.track.id, play.playedAt);
//   return {
//     id: newId,
//     trackId: play.track.id,
//     playedAt: play.playedAt,
//     userId: newUserId,
//   }
// });

// console.log(renamedPlays.length, "renamed plays created");

// // Write renamed plays to file
// await prisma.trackPlay.createMany({
//   data: renamedPlays,
//   skipDuplicates: true,
// });

// // // Drop all existing track plays
// // await prisma.trackPlay.deleteMany({});

