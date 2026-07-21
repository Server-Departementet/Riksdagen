"use client";

import { useSession } from "@/components/session-provider";
import { SidebarLink } from "@/components/sidebar/sidebar";
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
  },
) {
  const session = useSession();

  if (!session) return null;
  if (session.role !== role) return null;

  return (
    <SidebarLink href={href} className={className}>
      {children}
      <Image src={"/icons/crown.svg"} alt="(skyddad)" width={24} height={24} />
    </SidebarLink>
  );
}
