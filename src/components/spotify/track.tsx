"use client";

import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import SpotifyIconSVG from "@root/public/icons/spotify/Primary_Logo_Green_RGB.svg" with { type: "image/svg+xml" };
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Fragment, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { convertSecondsToTimeUnits, truncateNumber } from "@/functions/number-formatters";
import { getTrackDataBatch } from "@/functions/spotify/get-track-data";
import { getMergedTrackVariants } from "@/functions/spotify/get-merged-track-variants";
import { Album, Artist, Track } from "@/prisma/generated";
import { TrackWithCompany } from "@/types";
import { Layers3Icon } from "lucide-react";

export function TrackList({
  trackISRCs: allTrackISRCs,
  filterUserIds,
}: {
  trackISRCs: string[];
  filterUserIds: string[];
}) {
  const normalizedFilterUserIds = useMemo(
    () => Array.from(new Set(filterUserIds.filter(Boolean))).sort(),
    [filterUserIds],
  );
  const filterSignature = useMemo(() => normalizedFilterUserIds.join("|"), [normalizedFilterUserIds]);
  const trackListSignature = useMemo(() => allTrackISRCs.join("|"), [allTrackISRCs]);
  const dataSignature = useMemo(() => `${filterSignature}::${trackListSignature}`, [filterSignature, trackListSignature]);

  const batchSize = 100;
  const [loadedBatchState, setLoadedBatchState] = useState<{ signature: string; value: number }>(() => ({
    signature: dataSignature,
    value: 1,
  }));
  const loadedBatchCount = loadedBatchState.signature === dataSignature ? loadedBatchState.value : 1;
  const setLoadedBatchCount = useCallback((value: number | ((prev: number) => number)) => {
    setLoadedBatchState(prev => {
      const previousValue = prev.signature === dataSignature ? prev.value : 1;
      const nextValue = typeof value === "function"
        ? (value as (prev: number) => number)(previousValue)
        : value;

      if (prev.signature === dataSignature && nextValue === previousValue) {
        return prev;
      }

      return {
        signature: dataSignature,
        value: nextValue,
      };
    });
  }, [dataSignature]);
  const trackISRCBatches = useMemo<string[][]>(() =>
    new Array(Math.min(loadedBatchCount, Math.ceil(allTrackISRCs.length / batchSize)))
      .fill(0).map((_, i) => allTrackISRCs.slice(i * batchSize, i * batchSize + batchSize))
    , [allTrackISRCs, loadedBatchCount]);

  const [trackDataState, setTrackDataState] = useState<{
    signature: string;
    data: Record<string, TrackWithCompany>;
  }>(() => ({
    signature: dataSignature,
    data: {},
  }));
  const emptyTrackData = useMemo<Record<string, TrackWithCompany>>(() => ({}), []);
  const trackDataBatches = useMemo(() => (
    trackDataState.signature === dataSignature
      ? trackDataState.data
      : emptyTrackData
  ), [trackDataState, dataSignature, emptyTrackData]);
  const trackElements = useMemo<ReactNode[]>(() =>
    allTrackISRCs.map((trackISRC, index) =>
      <TrackElement
        key={`track-${trackISRC}`}
        trackData={trackDataBatches[trackISRC] ?? null}
        lineNumber={index + 1}
        filterUserIds={normalizedFilterUserIds}
      />
    ), [allTrackISRCs, trackDataBatches, normalizedFilterUserIds]);

  // Fetch track data when loadedBatchCount changes
  useEffect(() => {
    async function fetchTrackData() {
      const trackISRCToFetch = trackISRCBatches
        .flat()
        .filter(trackISRC => !(trackDataBatches && trackDataBatches[trackISRC]));

      if (trackISRCToFetch.length === 0) return;
      const trackDataArray = await getTrackDataBatch(trackISRCToFetch, {
        userIds: normalizedFilterUserIds,
      });
      setTrackDataState(prev => {
        const previousData = prev.signature === dataSignature ? prev.data : {};
        if (trackDataArray.length === 0 && prev.signature === dataSignature) {
          return prev;
        }

        const mergedData = { ...previousData };
        trackDataArray.forEach(trackData => {
          mergedData[trackData.ISRC] = trackData;
        });

        return {
          signature: dataSignature,
          data: mergedData,
        };
      });
    }
    fetchTrackData()
      .catch(console.error);
  }, [loadedBatchCount, trackISRCBatches, trackDataBatches, normalizedFilterUserIds, dataSignature]);

  return (<>
    <p
      className={`
        w-full lg:min-w-lg
        text-sm text-gray-600
        px-4 mb-1
  
        text-center 
        lg:text-start
      `}
    >
      {allTrackISRCs.length} Resultat
    </p>

    <ul
      onScroll={(e) => {
        // Derive what to load off of scroll position / total scroll height vs loadedBatchCount*batchSize / total track count
        const target = e.target as HTMLUListElement;

        const scrolled = target.scrollTop / target.scrollHeight;
        const totalBatches = Math.ceil(allTrackISRCs.length / batchSize);
        const batchesToLoad = Math.min(
          totalBatches,
          Math.ceil(scrolled * totalBatches) + 1,
        );
        if (batchesToLoad > loadedBatchCount) {
          setLoadedBatchCount(batchesToLoad);
        }
      }}
      className="*:mb-3 px-4 h-full w-full overflow-y-auto"
    >
      {trackElements}
    </ul>
  </>);
}

function TrackElement({
  trackData,
  lineNumber,
  filterUserIds,
}: {
  trackData: TrackWithCompany | null;
  lineNumber: number;
  filterUserIds: string[];
}) {
  const track = useMemo<Track | null>(() => trackData
    ? {
      id: trackData.id,
      albumId: trackData.albumId,
      name: trackData.name,
      url: trackData.url,
      duration: trackData.duration,
      ISRC: trackData.ISRC,
    }
    : null
    , [trackData]);
  const album = useMemo<Album | null>(() => trackData ? trackData.album : null, [trackData]);
  const artists = useMemo<Artist[] | null>(() => trackData ? trackData.artists : null, [trackData]);
  const trackPlays = useMemo<number | null>(() => trackData ? trackData._count.TrackPlays : null, [trackData]);

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

  const hasMergedVariants = (trackData?.mergedVariantCount ?? 1) > 1;
  const trackISRC = track?.ISRC ?? null;
  const filterSignature = useMemo(() => filterUserIds.join("|"), [filterUserIds]);

  const [isMergedPopoverOpen, setIsMergedPopoverOpen] = useState(false);
  const [mergedVariants, setMergedVariants] = useState<TrackWithCompany[] | null>(null);
  const [isMergedVariantsLoading, setIsMergedVariantsLoading] = useState(false);
  const [mergedVariantsError, setMergedVariantsError] = useState<string | null>(null);

  const loadMergedVariants = useCallback(async () => {
    if (!trackISRC || mergedVariants || isMergedVariantsLoading) return;
    setIsMergedVariantsLoading(true);
    setMergedVariantsError(null);
    try {
      const variants = await getMergedTrackVariants(trackISRC, {
        userIds: filterUserIds,
      });
      setMergedVariants(variants);
    } catch (error) {
      console.error(error);
      setMergedVariantsError("Kunde inte hämta sammanfogade spår.");
    } finally {
      setIsMergedVariantsLoading(false);
    }
  }, [trackISRC, mergedVariants, isMergedVariantsLoading, filterUserIds]);

  useEffect(() => {
    setMergedVariants(null);
    setMergedVariantsError(null);
    setIsMergedVariantsLoading(false);
    setIsMergedPopoverOpen(false);
  }, [filterSignature, trackISRC]);

  useEffect(() => {
    if (isMergedPopoverOpen && hasMergedVariants) {
      void loadMergedVariants();
    }
  }, [isMergedPopoverOpen, hasMergedVariants, loadMergedVariants]);

  return (
    <li
      className={`
        h-(--spotify-track-height) min-h-(--spotify-track-height) max-h-(--spotify-track-height) 

        w-full max-w-prose 
        lg:w-[65ch]
        
        bg-zinc-100
        flex-1 
        grid 
        grid-cols-[128px_1fr_max-content_max-content] 
        grid-rows-[max-content_max-content_1fr_max-content] 
        rounded-lg 
        gap-x-2 gap-y-1
        overflow-hidden 
        relative
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
        <div className={`
          col-start-3 col-span-2 row-start-4
          flex items-center justify-between 
          gap-2 
          mb-1.5 sm:mb-2 me-1.5 sm:me-2 px-2.5
        `}>
          {hasMergedVariants && track ? (
            <Popover open={isMergedPopoverOpen} onOpenChange={setIsMergedPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Visa sammanfogade versioner"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white shadow focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
                >
                  <Layers3Icon className="size-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" side="top" className="w-80 text-sm">
                <p className="mb-1 font-semibold">Sammanfogade versioner</p>
                <p className="mb-3 text-xs text-muted-foreground">ISRC {track.ISRC}</p>
                {isMergedVariantsLoading && <p>Laddar spår...</p>}
                {!isMergedVariantsLoading && mergedVariantsError && (
                  <p className="text-sm text-destructive">{mergedVariantsError}</p>
                )}
                {!isMergedVariantsLoading && !mergedVariantsError && mergedVariants && mergedVariants.length > 0 ? (
                  <ul className="space-y-2">
                    {mergedVariants.map((variant) => {
                      const releaseDateLabel = variant.album.releaseDate
                        ? new Date(variant.album.releaseDate).toLocaleDateString("sv-SE", { year: "numeric", month: "short" })
                        : "Okänt datum";
                      const isCanonical = variant.id === track.id;
                      return (
                        <li
                          key={variant.id}
                          className={`rounded-md border p-2 ${isCanonical ? "border-green-500 bg-green-50" : "border-border bg-muted"}`}
                        >
                          <p className="flex items-center justify-between text-sm font-medium">
                            <Link
                              href={variant.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate pr-2 underline-offset-2 hover:underline"
                            >
                              {variant.name}
                            </Link>
                            {isCanonical && <span className="text-xs font-semibold text-green-700">Visas</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Link
                              href={variant.album.url ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline-offset-2 hover:underline"
                            >
                              {variant.album.name}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {variant._count.TrackPlays.toLocaleString("sv-SE")}&nbsp;{variant._count.TrackPlays === 1 ? "lyssning" : "lyssningar"}&nbsp;&nbsp;&middot;&nbsp;&nbsp;släpptes&nbsp;{releaseDateLabel}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {!isMergedVariantsLoading && !mergedVariantsError && (!mergedVariants || mergedVariants.length === 0) && (
                  <p className="text-sm text-muted-foreground">Inga ytterligare versioner hittades.</p>
                )}
              </PopoverContent>
            </Popover>
          ) : null}
          <OpenInSpotifyButton trackURL={track?.url ?? "#"} />
        </div>
      </>}
    </li>
  );
}

function OpenInSpotifyButton({ trackURL }: { trackURL: string }) {
  return (
    <Link href={trackURL} className="col-start-3 col-span-2 row-start-4 justify-self-end self-end" target="_blank" rel="noopener noreferrer">
      <Button tabIndex={-1}>
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