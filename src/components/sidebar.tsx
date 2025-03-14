import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import * as Icon from "lucide-react";
import Link from "next/link";
import { ClerkLogin } from "@/components/login-button";

export function SidebarLink(
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
  return (
    <Link href={href} className={`${className}`}>
      {children}
    </Link>
  );
}

export function ExternalLink(
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
  return (
    <Link href={href} className={`flex flex-row items-center gap-x-1 ${className}`} target="_blank">
      {children}
      <Icon.ExternalLink size={22} strokeWidth={1} color="#222" />
    </Link>
  );
}

export function Sidebar(
  {
    children
  }: {
    children: React.ReactNode
  }
) {
  return (<>
    {/* Side bar */}
    <Sheet>
      <SheetTrigger className="hover:text-gray-300 active:text-gray-300">
        <Icon.Menu size={44} />
      </SheetTrigger>

      <SheetContent className="[&>button]:hidden">
        {/* Header */}
        <SheetHeader className="h-20 flex flex-row items-center justify-between px-6 -ml-0.5 bg-gray-800">
          {/* Login */}
          <ClerkLogin nameSide="right" className="text-background" />

          {/* Close button */}
          <SheetTrigger>
            <Icon.X size={44} className="text-alt-foreground" />
          </SheetTrigger>
        </SheetHeader>

        {/* Nav */}
        <nav className="flex flex-col gap-y-3 mx-5 text-xl">
          {children}
        </nav>

        {/* Accessibility */}
        <SheetTitle className="hidden">Menu</SheetTitle>
      </SheetContent>
    </Sheet>
  </>);
}