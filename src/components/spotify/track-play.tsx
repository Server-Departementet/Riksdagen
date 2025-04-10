import { Track } from "@prisma/client";

export function TrackPlay({ track }: { track: Track }) {
  return (
    <div className="flex flex-row">
      <p>{track.name}</p>
      <p>{track.url}</p>
      <p>{track.duration} ms</p>
    </div>
  )
}