import "server-only";
import { ExternalLink, SidebarLink } from "@/components/sidebar/sidebar";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import Image from "next/image";

export async function ProtectedLink(
  {
    href,
    hidden,
    children,
    className = "",
  }: {
    href: string;
    hidden: boolean;
    children: React.ReactNode;
    className?: string;
  }
) {
  if (!hidden) return null;

  return (
    <SidebarLink href={href} className={className}>
      {children}
      <Image src={CrownSVG} alt="(skyddad)" />
    </SidebarLink>
  );
}

export async function ProtectedExternalLink(
  {
    href,
    hidden,
    children,
    className = "",
  }: {
    href: string;
    hidden: boolean;
    children: React.ReactNode;
    className?: string;
  }
) {
  if (!hidden) return null;

  return (
    <ExternalLink href={href} className={className}>
      {children}
      <Image src={CrownSVG} alt="(skyddad)" />
    </ExternalLink>
  );
}