import * as Icon from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };

export default function Custom404() {
  return (
    <main className="pb-20 flex flex-col gap-y-2 justify-center items-center">

      <section className="z-10 flex flex-col gap-y-[inherit] justify-center items-center">
        {/* Message */}
        <h1 className="text-7xl">404</h1>
        <p className="text-xl">Sidan hittades inte</p>
        <Icon.Frown strokeWidth={1} size={32} />

        {/* Go home button */}
        <Link className="unset mt-10" href={"/"}>
          <button className="button">Åk hem</button>
        </Link>
      </section>

      {/* Big background crowns */}
      <div className="pointer-events-none absolute opacity-50 flex flex-col justify-center items-center gap-x-2">
        <div className="flex flex-row justify-center items-center gap-x-2">
          <Image src={CrownSVG} height={230} width={230} alt="" />
          <Image src={CrownSVG} height={230} width={230} alt="" />
        </div>
        <Image src={CrownSVG} height={230} width={230} alt="" />
      </div>
    </main>
  )
}