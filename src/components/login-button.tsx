"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import * as Icon from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSession } from "@/components/session-provider";

type NameSide = "left" | "right" | "none";

export function LoginButton(
  {
    className = "",
    nameSide = "left",
  }: {
    className?: string,
    nameSide?: NameSide,
  },
) {
  const session = useSession();
  const pathname = usePathname();

  return (
    <div className={`flex flex-row items-center justify-center ${className}`}>
      {/* Not logged in */}
      {!session && (
        <a
          href={`/api/auth/login?next=${encodeURIComponent(pathname)}`}
          className="w-min flex flex-row items-center justify-center gap-x-2 px-7 py-2.5 bg-[#5865f2] text-white rounded-lg font-bold no-underline hover:text-white hover:drop-shadow-lg cursor-pointer"
        >
          <Image
            width={24} height={24}
            src="/icons/discord/discord-white.svg"
            className="size-6"
            alt="Discord"
          />
          Login
        </a>
      )}

      {/* Logged in */}
      {session && (
        <Popover>
          <PopoverTrigger className="flex flex-row items-center gap-3 me-1 cursor-pointer">
            {/* Name */}
            <span className={`${nameSide === "right" ? "order-1" : ""} ${nameSide === "none" ? "hidden" : ""}`}>
              {session.name}
            </span>
            {/* Avatar */}
            <Image
              width={40} height={40}
              src={session.avatar}
              className="size-10 rounded-full"
              alt=""
            />
          </PopoverTrigger>
          <PopoverContent className="w-fit p-2">
            <a
              href="/api/auth/logout"
              className="flex flex-row items-center gap-x-2 px-3 py-2 no-underline rounded-md hover:bg-gray-100"
            >
              <Icon.LogOut size={18} />
              Log out
            </a>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
