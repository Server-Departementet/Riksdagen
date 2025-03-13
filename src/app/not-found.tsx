import * as Icon from "lucide-react";
import Link from "next/link";

export default function Custom404() {
  return (
    <main className="pb-20 flex flex-col gap-y-2 justify-center items-center">
      <h1 className="text-7xl">404</h1>
      <p className="text-xl">Sidan hittades inte</p>
      <Icon.Frown strokeWidth={1} size={32} />

      <Link className="unset mt-10" href={"/"}>
        <button className="button">Åk hem</button>
      </Link>
    </main>
  )
}