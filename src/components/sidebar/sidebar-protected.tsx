import { currentUser } from "@clerk/nextjs/server";
import { SidebarLink } from "./sidebar";

export async function ProtectedLink(
  {
    href,
    children,
    role = "",
  }: {
    href: string,
    children: React.ReactNode
    role?: string
  }
) {
  const user = await currentUser();
  if (!user) return null;
  if (user.publicMetadata.role !== role) return null;

  return <SidebarLink href={href}>{children}</SidebarLink>;
}