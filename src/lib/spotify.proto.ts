import { FetchFilterPacket, FilterHash, Track, TrackId, TrackStats } from "@/app/spotify/types";
import * as protobuf from "protobufjs";
import { sha1 } from "@/lib/hash";

/* Track index */
const TrackIndexPacket = protobuf.Root.fromJSON({
  nested: {
    TrackIndexPacket: {
      fields: {
        filterHash: { type: "string", id: 1 },
        trackIds: { rule: "repeated", type: "string", id: 2 }
      }
    }
  }
}).lookupType("TrackIndexPacket");

export function encodeTrackIndex(index: TrackId[], filter: FetchFilterPacket): Uint8Array {
  return TrackIndexPacket.encode({
    filterHash: sha1(JSON.stringify(filter)),
    trackIds: index,
  }).finish();
}

export function decodeTrackIndex(data: Uint8Array): { filterHash: FilterHash; trackIds: TrackId[] } {
  const decoded = TrackIndexPacket.decode(Buffer.from(data)).toJSON();

  return {
    filterHash: decoded.filterHash,
    trackIds: decoded.trackIds,
  };
}

/* Track data */
const TrackDataPacket = protobuf.Root.fromJSON({
  nested: {
    TrackDataPacket: {
      fields: {
        filterHash: { type: "string", id: 1 },
        trackData: { rule: "repeated", type: "TrackData", id: 2 }
      }
    },
    TrackData: {
      fields: {
        name: { type: "string", id: 1 },
        id: { type: "string", id: 2 },
        duration: { type: "int64", id: 3 },
        url: { type: "string", id: 4 },
        image: { type: "string", id: 5 },
        albumId: { type: "string", id: 6 },
        album: { type: "AlbumData", id: 7 },
        artists: { rule: "repeated", type: "ArtistData", id: 8 },
        color: { type: "string", id: 9 }
      }
    },
    AlbumData: {
      fields: {
        name: { type: "string", id: 1 },
        id: { type: "string", id: 2 },
        url: { type: "string", id: 3 },
        image: { type: "string", id: 4 }
      }
    },
    ArtistData: {
      fields: {
        name: { type: "string", id: 1 },
        id: { type: "string", id: 2 },
        url: { type: "string", id: 3 },
        image: { type: "string", id: 4 }
      }
    }
  }
}).lookupType("TrackDataPacket");

export function encodeTrackData(tracks: Track[]): Uint8Array {
  return TrackDataPacket.encode({
    trackData: tracks,
  }).finish();
}

export function decodeTrackData(data: Uint8Array): { trackData: Track[] } {
  const decoded = TrackDataPacket.decode(Buffer.from(data)).toJSON();

  if (!decoded.trackData || !Array.isArray(decoded.trackData)) {
    return { trackData: [] };
  }

  return {
    trackData: decoded.trackData,
  };
}

/* Track stats */
const TrackStatsPacket = protobuf.Root.fromJSON({
  nested: {
    TrackStatsPacket: {
      fields: {
        filterHash: { type: "string", id: 1 },
        trackStats: { rule: "repeated", type: "TrackStat", id: 2 }
      }
    },
    TrackStat: {
      fields: {
        trackId: { type: "string", id: 1 },
        totalPlays: { type: "int64", id: 2 },
        totalMS: { type: "int64", id: 3 },
        playsPerUser: { type: "string", id: 4 } // Stringified JSON of user plays
      }
    }
  }
}).lookupType("TrackStatsPacket");

export function encodeTrackStats(stats: TrackStats[], filter: FetchFilterPacket): Uint8Array {
  return TrackStatsPacket.encode({
    filterHash: sha1(JSON.stringify(filter)),
    trackStats: stats.map(stat => ({
      ...stat,
      playsPerUser: JSON.stringify(stat.playsPerUser),
    })),
  }).finish();
}

export function decodeTrackStats(data: Uint8Array): { filterHash: FilterHash; trackStats: TrackStats[] } {
  const decoded = TrackStatsPacket.decode(Buffer.from(data)).toJSON();

  if (!decoded.trackStats || !Array.isArray(decoded.trackStats)) {
    return { filterHash: decoded.filterHash, trackStats: [] };
  }

  return {
    filterHash: decoded.filterHash,
    trackStats: decoded.trackStats.map((stat: Omit<TrackStats, "playsPerUser"> & { playsPerUser: string }) => ({
      ...stat,
      playsPerUser: JSON.parse(stat.playsPerUser),
    })),
  };
}