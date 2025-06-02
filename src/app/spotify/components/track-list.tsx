import Track from "@/app/spotify/components/track";

export default function TrackList({ className = "" }: { className?: string }) {
  return (
    <ul className={`
      overflow-y-auto 
      flex flex-col
      gap-y-3
      ${className}
    `}>
      {new Array(15).fill(0).map((_, i) => <Track lineNumber={i + 1} key={`track-${i}`} />)}
    </ul>
  );
}