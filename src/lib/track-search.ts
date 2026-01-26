type TrackSearchWhere = {
  OR: Array<{
    track?: {
      name?: { contains: string };
      album?: { name?: { contains: string } };
      artists?: { some: { name?: { contains: string } } };
      ISRC?: string;
    };
    trackId?: string;
  }>;
};

export function buildTrackSearchWhere(trackSearchQuery?: string): TrackSearchWhere | undefined {
  const query = trackSearchQuery?.trim();
  if (!query) {
    return undefined;
  }

  return {
    OR: [
      { track: { name: { contains: query } } },
      { track: { album: { name: { contains: query } } } },
      { track: { artists: { some: { name: { contains: query } } } } },
      { trackId: query },
      { track: { ISRC: query } },
    ],
  };
}
