import "@/app/global.tw.css";
import { Open_Sans, Outfit } from "next/font/google";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import * as Icon from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ClerkProvider } from "@clerk/nextjs";
import { ClerkLogin } from "@/components/login-button";

/* Used in global css */
const _outfit = Outfit({ subsets: ["latin"] });
const _openSans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Riksdagen",
  authors: [
    { name: "Viggo Ström", url: "https://viggostrom.github.io/" },
    { name: "Axel Thornberg", url: "https://axel.thornberg.se/" },
    { name: "Emil Winroth", url: "https://www.linkedin.com/in/emil-winroth-711750326/" },
  ],
  description: "Samlingsplatsen för 'Regeringens' alla ärenden.",
  icons: {
    icon: "/icons/favicon.png",
  },
};

export default async function RootLayout({ children }: {
  children: React.ReactNode
}) {
  return (<ClerkProvider>
    <html lang="sv">
      <body>
        {/* Header */}
        <header className="z-10 py-3 px-5 h-20">
          {/* Logo */}
          <Link href="/" className="flex flex-row items-center gap-x-4 no-underline hover:text-inherit">
            {/* Icon */}
            <Image width={64} height={64} className={`size-[3.5rem] rounded-lg`} src="/icons/header-logo.png" alt="Logo" />

            {/* Title */}
            <p className="text-2xl font-medium title-font">Riksdagen</p>
          </Link>

          {/* Right group */}
          <div className="flex flex-row items-center justify-between gap-x-6 mr-1">
            {/* Account button */}
            <ClerkLogin nameSide="left" className="not-sm:hidden" />

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
                  <Link href="/">Hem</Link>
                  <Link href="/road-and-rail">Minecraft Road & Rail Generator</Link>
                  <Link href="https://vr-radio.tailad6f63.ts.net/" target="_blank" className="flex flex-row items-center gap-x-1">
                    Viggos Radio
                    <Icon.ExternalLink size={22} strokeWidth={1} color="#222" />
                  </Link>
                  <Link href="">Text about stuff</Link>
                  <Link href="">Text about stuff</Link>
                </nav>

                <SheetTitle className="hidden">Menu</SheetTitle>
              </SheetContent>
            </Sheet>
          </div>
        </header>


        {children}

        <footer className="p-3 mt-5">
          <p>© 2025 Viggo Ström, Axel Thornberg & Emil Winroth</p>
        </footer>
      </body>
    </html>
  </ClerkProvider>)
}