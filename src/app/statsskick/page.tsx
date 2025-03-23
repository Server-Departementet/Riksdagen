import ministersDB from "@root/ministers.json" with { type: "json"};
import Link from "next/link";

export default function Page() {
  return (
    <main className="pt-20">
      <h1>
        Statsskick
      </h1>

      <p className="mt-5 text-xl italic text-center bg-yellow-400 font-medium">
        OBS! Vi är inte den svenska regeringen eller riksdagen.
      </p>

      <p className="mt-5 max-w-prose">
        Vi är en liten grupp som kallar oss själva för <span className="italic">Regeringen</span> på ett skämtsamt sätt. Vi har utsett varandra till ministrar inom diverse områden ({Object.keys(ministersDB).length} stycken!). Du kan se alla ministerposter <Link className="global" href="/ministrar">här</Link>.
      </p>
    </main>
  )
}