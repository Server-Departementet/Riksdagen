import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

type NameSide = "left" | "right" | "none";

function LoggedInSkeleton({ nameSide = "left" }: { nameSide: NameSide }) {
  return (
    <div className="flex flex-row items-center gap-3 me-1">
      {/* Name */}
      <div className={`bg-gray-700 w-[10ch] h-[1rem] rounded-sm ${nameSide === "right" ? "order-1" : ""} ${nameSide === "none" ? "hidden" : ""}`}></div>
      {/* Avatar */}
      <div className={`bg-gray-700 size-10 rounded-full`}></div>
    </div>
  );
}

export function ClerkLogin(
  {
    className = "",
    nameSide = "left",
  }: {
    className?: string,
    nameSide?: NameSide,
  }
) {
  return (
    <div className={`flex flex-row items-center justify-center ${className}`}>
      {/* Not logged in */}
      <SignedOut>
        <SignInButton>
          <button className="w-min flex flex-row items-center justify-center gap-x-2 px-7 py-2.5 bg-[#5865f2] text-white rounded-lg font-bold no-underline hover:text-white hover:drop-shadow-lg cursor-pointer">
            <Image width={24} height={24} src="/icons/discord/discord-white.svg" alt="Discord"></Image>
            Login
          </button>
        </SignInButton>
      </SignedOut>

      {/* Logged in */}
      <SignedIn>
        <UserButton fallback={LoggedInSkeleton({ nameSide })} showName={nameSide !== "none"} appearance={{
          layout: { shimmer: false },
          elements: {
            userButtonBox: `!me-0 ${nameSide === "right" ? "!gap-2" : ""}`,
            userButtonOuterIdentifier: (nameSide === "right" ? "order-1" : ""),
          }
        }} />
      </SignedIn>
    </div>
  )
}