"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import * as Icon from "lucide-react";
import Link from "next/link";
import { ClerkLogin } from "@/components/login-button";
import { useEffect, useState } from "react";

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
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!e.target) return;
    const target = e.target as HTMLAnchorElement | HTMLButtonElement;
    if (target.tagName === "A") {
      target.querySelector("button")?.click();
    }
  };

  return (
    <Link href={href} className={`w-full ${className}`}
      onClick={onClick}
    >
      <SheetTrigger tabIndex={-1} className="[all:inherit] !w-full !flex !flex-row !gap-x-2 !items-center">
        {children}
      </SheetTrigger>
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
    <SidebarLink href={href} className={`${className}`}>
      {children}
      <Icon.ExternalLink size={22} strokeWidth={1} color="#222" />
    </SidebarLink>
  );
}

/** Sidebar children are the links shown in the nav */
export function Sidebar(
  {
    children
  }: {
    children: React.ReactNode
  }
) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent pull-to-refresh when sidebar is open
  useEffect(() => {
    const preventPullToRefresh = (e: TouchEvent) => {
      e.preventDefault();
    };

    if (isOpen) {
      document.addEventListener("touchmove", preventPullToRefresh, { passive: false });
    }

    return () => {
      document.removeEventListener("touchmove", preventPullToRefresh);
    };
  }, [isOpen]);

  return (<>
    {/* Side bar */}
    <Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <SheetTrigger className="hover:text-gray-300 active:text-gray-300">
        <Icon.Menu size={44} />
      </SheetTrigger>

      {/* Background */}
      {isOpen && (
        <div className="absolute top-0 left-0 w-[100dvw] h-[100dvh] bg-black/50 animate-in fade-in duration-200 ease-in"></div>
      )}

      <SheetContent className="[&>button]:hidden flex flex-col items-start justify-start gap-0 [&>*]:w-full">
        {/* Header */}
        <SheetHeader className="h-20 py-10 flex flex-row items-center justify-between px-6 bg-gray-800 -ml-0.5 !w-[101%]" style={{ backgroundSize: "cover" }}>
          {/* Login */}
          <ClerkLogin nameSide="right" className="text-background" />

          {/* Close button */}
          <SheetTrigger>
            <Icon.X size={44} className="text-alt-foreground" />
          </SheetTrigger>
        </SheetHeader>

        {/* Nav */}
        <nav className="flex flex-col gap-y-3 px-5 text-xl overflow-y-scroll pt-4 pb-6">
          {children}
        </nav>

        {/* Accessibility */}
        <SheetTitle className="hidden">Menu</SheetTitle>
      </SheetContent>
    </Sheet>
  </>);
}