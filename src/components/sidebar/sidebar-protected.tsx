"use client";

import { useUser } from "@clerk/nextjs";
import { SidebarLink } from "@/components/sidebar/sidebar";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import Image from "next/image";

export function ProtectedLink(
  {
    href,
    children,
    className = "",
    role = "",
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    role?: string;
  }
) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return null;
  if (!isSignedIn || !user) return null;
  if (user.publicMetadata?.role !== role) return null;

  return (
    <SidebarLink href={href} className={className}>
      {children}
      <Image src={CrownSVG} alt="(skyddad)" />
    </SidebarLink>
  );
}