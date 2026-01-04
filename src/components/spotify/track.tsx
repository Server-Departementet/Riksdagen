"use client";

import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { convertSecondsToTimeUnits, truncateNumber } from "@/functions/number-formatters";
import { getTrackDataBatch } from "@/functions/spotify/get-track-data";
import { Album, Artist, Track } from "@/prisma/generated";
import { TrackWithData } from "@/types";


export function TrackList({
  trackIds: allTrackIds,
}: {
  trackIds: string[];
}) {
  const batchSize = 50;
  const [loadedBatchCount, setLoadedBatchCount] = useState<number>(1);
  const trackIdBatches = useMemo<string[][]>(() =>
    new Array(Math.min(loadedBatchCount, Math.ceil(allTrackIds.length / batchSize)))
      .fill(0).map((_, i) => allTrackIds.slice(i * batchSize, i * batchSize + batchSize))
    , [allTrackIds, loadedBatchCount]);
  const [trackDataBatches, setTrackDataBatches] = useState<Record<string, TrackWithData>>({});
  const trackElements = useMemo<ReactNode[]>(() =>
    allTrackIds.map((trackId, index) =>
      <TrackElement
        key={`track-${trackId}`}
        trackData={trackDataBatches[trackId] ?? null}
        lineNumber={index + 1}
      />
    ), [allTrackIds, trackDataBatches]);

  // Fetch track data when loadedBatchCount changes
  useEffect(() => {
    async function fetchTrackData() {
      const trackIdsToFetch = trackIdBatches
        .flat()
        .filter(trackId => !(trackDataBatches && trackDataBatches[trackId]));
      if (trackIdsToFetch.length === 0) return;
      const trackDataArray = await getTrackDataBatch(trackIdsToFetch);
      setTrackDataBatches(prev => {
        const newData = { ...prev };
        trackDataArray.forEach(trackData => {
          newData[trackData.id] = trackData;
        });
        // console.log(Object.keys(newData));
        return newData;
      });
    }
    fetchTrackData()
      .catch(console.error);
  }, [loadedBatchCount, trackIdBatches, trackDataBatches]);

  // On scroll, load more tracks
  useEffect(() => {
    function onScroll() {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        setLoadedBatchCount(p => Math.min(p + 1, Math.ceil(allTrackIds.length / batchSize)));
      }
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }
    onScroll();
  }, [allTrackIds.length]);

  return (<>
    <p
      className={`
        w-full min-w-lg
        text-sm text-gray-600
        px-4 mb-1
  
        text-center 
        lg:text-start
      `}
    >
      {allTrackIds.length} Resultat&nbsp;&nbsp;&middot;&nbsp;&nbsp;NNNN ms
    </p>

    <ul className="*:mb-3 px-4 h-full w-full overflow-y-auto">
      {trackElements}
    </ul>
  </>);
}

function TrackElement({
  trackData,
  lineNumber,
}: {
  trackData: TrackWithData | null;
  lineNumber: number;
}) {
  const track = useMemo<Track | null>(() => trackData
    ? {
      id: trackData.id,
      albumId: trackData.albumId,
      name: trackData.name,
      url: trackData.url,
      duration: trackData.duration,
    }
    : null
    , [trackData]);
  const album = useMemo<Album | null>(() => trackData
    ? trackData.album : null, [trackData]);
  const artists = useMemo<Artist[] | null>(() => trackData
    ? trackData.artists : null, [trackData]);
  const trackPlays = useMemo<number | null>(() => trackData
    ? trackData._count.TrackPlays : null, [trackData]);

  const timeUnits = useMemo(() => {
    if (!track) return { minute: " ", second: " " };
    return convertSecondsToTimeUnits(Math.floor(track.duration / 1000));
  }, [track]);
  const prettyDuration = useMemo(() => {
    if (!track) return "...";
    const minutes = Math.floor(track.duration / 60000);
    const seconds = Math.floor((track.duration % 60000) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [track]);

  const totalPlaytimeSeconds = useMemo(() => {
    if (!track || trackPlays === null) return 0;
    return Math.floor((trackPlays * track.duration) / 1000);
  }, [track, trackPlays]);

  const prettyPlayCount = useMemo(() => {
    if (trackPlays === null) return "...";
    if (trackPlays === 0) return "Inga lyssningar";
    if (trackPlays === 1) return "1 lyssning";
    if (trackPlays < 1000) return `${trackPlays} lyssningar`;

    const truncated = truncateNumber(trackPlays);
    return `${truncated} lyssningar`;
  }, [trackPlays]);

  const prettyPlaytime = useMemo(() => {
    return Object.values(convertSecondsToTimeUnits(totalPlaytimeSeconds))
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
  }, [totalPlaytimeSeconds]);

  return (
    <li
      className={`
        h-(--spotify-track-height) min-h-(--spotify-track-height) max-h-(--spotify-track-height) 

        w-full max-w-prose 
        lg:min-w-75
        
        bg-zinc-100
        flex-1 
        grid 
        grid-cols-[128px_1fr_max-content_max-content] 
        grid-rows-[max-content_max-content_1fr_max-content] 
        rounded-lg 
        gap-x-2 gap-y-1
        overflow-hidden 
      `}
      {...album?.color
        ? { style: { backgroundColor: album.color } }
        : {}
      }
    >{!track
      ? <>
        {/* 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design */}
        <Image
          width={128} height={128}
          className="col-start-1 row-start-1 row-span-4 rounded-lg size-full aspect-square bg-gray-200"
          src={CrownSVG} alt="Låtbild"
        />
      </>
      : <>
        {/* 4px rounding as per spotifys guidelines https://developer.spotify.com/documentation/design */}
        <Image
          width={128} height={128}
          className="col-start-1 row-start-1 row-span-4 rounded-lg size-full aspect-square bg-gray-200"
          src={album?.image ?? CrownSVG} alt="Låtbild"
        />

        {/* Track Title */}
        <h5 className={`
          col-start-2 row-start-1 col-span-2
          leading-5 py-1 overflow-x-hidden whitespace-nowrap text-ellipsis overflow-y-hidden
        `}>
          {track?.name ?? "..."}
        </h5>

        {/* Artists and album */}
        <p className={`
          col-start-2 row-start-2 col-span-2 
          pb-1 leading-4 
          text-sm
          opacity-75 
          whitespace-nowrap text-ellipsis overflow-x-hidden
        `}>
          {artists?.map((artist, i) =>
            <Fragment key={`artist-${artist.id}`}>
              <Link href={artist.url}
                className="font-semibold"
                target="_blank" rel="noopener noreferrer"
              >
                {artist.name}
              </Link>
              {i < artists.length - 1 && <span>,&nbsp;</span>}
            </Fragment>
          )}
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <Link href={album?.url ?? "#"} target="_blank" rel="noopener noreferrer">
            {album?.name ?? "..."}
          </Link>
        </p>

        {/* Stats */}
        <div className="row-span-2 col-start-2 text-sm overflow-y-hidden whitespace-nowrap overflow-x-auto">
          {/* Duration (long) */}
          <p className="">Längd {timeUnits.minute} {timeUnits.second} ({prettyDuration})</p>
          {/* Listening time (long) */}
          <p className="">{prettyPlayCount} ({prettyPlaytime})</p>
        </div>

        {/* Line number */}
        <div className="col-start-3 col-span-2 row-start-1 flex flex-row items-center justify-end px-1">
          {/* Circle/Pill */}
          <span className="bg-zinc-100 rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
            {/* Number */}
            <span className="text-center align-middle text-xs">{lineNumber}</span>
          </span>
        </div>

        {/* Spotify Link */}
        <OpenInSpotifyButton trackURL={track?.url ?? "#"} />
      </>}
    </li>
  );
}

function OpenInSpotifyButton({ trackURL }: { trackURL: string }) {
  return (
    <Link href={trackURL} className="col-start-3 col-span-2 row-start-4 justify-self-end self-end" target="_blank" rel="noopener noreferrer">
      <Button tabIndex={-1} className="mb-1.5 sm:mb-2 me-1.5 sm:me-2 px-2.5">
        <Image
          width={21} height={21}
          className="size-5.25"
          src={SpotifyIconSVG} alt="Spotify"
        />

        {/* Hides on smaller screens for space savings */}
        <span className="hidden lg:block">
          Öppna i Spotify
        </span>
      </Button>
    </Link>
  );
}