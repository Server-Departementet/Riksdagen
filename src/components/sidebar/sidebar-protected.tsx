import { ExternalLink, SidebarLink } from "@/components/sidebar/sidebar";
import CrownSVG from "@root/public/icons/crown.svg" with { type: "image/svg+xml" };
import Image from "next/image";
import { isMinister } from "@/lib/auth";

export async function ProtectedLink(
  {
    href,
    children,
    className = "",
  }: {
    href: string,
    children: React.ReactNode
    className?: string
  }
) {
  if (!await isMinister()) return null;

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
    children,
    className = "",
  }: {
    href: string,
    children: React.ReactNode
    className?: string
  }
) {
  if (!await isMinister()) return null;

  return (
    <ExternalLink href={href} className={className}>
      {children}
      <Image src={CrownSVG} alt="(skyddad)" />
    </ExternalLink>
  );
}