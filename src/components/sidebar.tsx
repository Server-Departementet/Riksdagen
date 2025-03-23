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
    <SheetTrigger tabIndex={-1} className="unset">
      <Link href={href} className={`w-full ${className}`}>
        {children}
      </Link>
    </SheetTrigger>
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
    <SheetTrigger tabIndex={-1} className="unset">
      <Link href={href} className={`w-full flex flex-row items-center gap-x-1 ${className}`} target="_blank">
        {children}
        <Icon.ExternalLink size={22} strokeWidth={1} color="#222" />
      </Link>
    </SheetTrigger>
  );
}

/** Sidebar children are the links shown in the nav */
export function Sidebar(
  {
    children
  }: {
    children: React.ReactNode[]
  }
) {
  return (<>
    {/* Side bar */}
    <Sheet modal={false}>
      <SheetTrigger className="hover:text-gray-300 active:text-gray-300">
        <Icon.Menu size={44} />
      </SheetTrigger>

      <SheetContent className="[&>button]:hidden flex flex-col items-start justify-start gap-0 [&>*]:w-full">
        {/* Header */}
        <SheetHeader className="h-20 py-10 flex flex-row items-center justify-between px-6 bg-gray-800 -ml-0.5 !w-[105%]" style={{ backgroundSize: "cover" }}>
          {/* Login */}
          <ClerkLogin nameSide="right" className="text-background" />

          {/* Close button */}
          <SheetTrigger>
            <Icon.X size={44} className="text-alt-foreground" />
          </SheetTrigger>
        </SheetHeader>

        {/* Nav */}
        <nav className="flex flex-col gap-y-3 px-5 text-xl overflow-y-scroll pt-4">
          {children}
        </nav>

        {/* Accessibility */}
        <SheetTitle className="hidden">Menu</SheetTitle>
      </SheetContent>
    </Sheet>
  </>);
}