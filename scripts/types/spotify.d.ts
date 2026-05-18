
export type UsersRecentlyPlayedTracksResponse = {
  items: {
    track: {
      album: {
        album_type: string;
        artists: {
          external_urls: {
            spotify: string;
          };
          href: string;
          id: string;
          name: string;
          type: string;
          uri: string;
        }[];
        available_markets: {
          0: string;
          1: string;
        }[];
        external_urls: {
          spotify: string;
        };
        href: string;
        id: string;
        images: {
          height: number;
          url: string;
          width: number;
        }[];
        name: string;
        release_date: string;
        release_date_precision: string;
        total_tracks: number;
        type: string;
        uri: string;
      };
      artists: {
        external_urls: {
          spotify: string;
        };
        href: string;
        id: string;
        name: string;
        type: string;
        uri: string;
      }[];
      available_markets: {
        0: string;
        1: string;
      }[];
      disc_number: number;
      duration_ms: number;
      explicit: boolean;
      external_ids: {
        isrc: string;
      };
      external_urls: {
        spotify: string;
      };
      href: string;
      id: string;
      is_local: boolean;
      name: string;
      popularity: number;
      preview_url: object;
      track_number: number;
      type: string;
      uri: string;
    };
    played_at: string;
    context: {
      type: string;
      href: string;
      external_urls: {
        spotify: string;
      };
      uri: string;
    };
  }[];
  next: string;
  cursors: {
    after: string;
    before: string;
  };
  limit: number;
  href: string;
};
