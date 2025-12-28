import "@/app/global.tw.css";
import { Open_Sans, Outfit } from "next/font/google";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { ClerkLogin } from "@/components/login-button";
import { ExternalLink, Sidebar, SidebarLink } from "@/components/sidebar/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ProtectedLink } from "@/components/sidebar/sidebar-protected";

/* Used in global css */
const _outfit = Outfit({ subsets: ["latin"] });
const _openSans = Open_Sans({ subsets: ["latin"] });

const appName = "Riksdagen";
const description = "Samlingsplatsen för 'Regeringens' alla ärenden. Vi är inte den riktiga regeringen eller riksdagen för den delen. Läs mer om vårt statsskick här.";
const url = process.env.CANONICAL_URL || "";
export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description,
  authors: [
    { name: "Vena Ström", url: "https://venastrom.se/" },
    { name: "Axel Thornberg", url: "https://axel.thornberg.se/" },
    { name: "Emil Winroth", url: "https://www.linkedin.com/in/emil-winroth-711750326/" },
  ],
  twitter: {
    card: "summary_large_image",
    title: appName,
    description,
    images: [`${url}/icons/regeringen/regeringen-favicon.svg`],
  },
  openGraph: {
    title: appName,
    siteName: appName,
    url,
    description,
    images: [
      {
        url: `${url}/icons/regeringen/regeringen-favicon.svg`,
        width: 512,
        height: 512,
      },
    ],
    countryName: "Sweden",
    locale: "sv_SE",
    type: "website",
  },
  icons: {
    icon: `${url}/icons/regeringen/regeringen-favicon.svg`,
    apple: `${url}/icons/regeringen/regeringen-favicon.svg`,
  },
};

export default async function RootLayout({ children }: {
  children: React.ReactNode
}) {
  return (<ClerkProvider>
    <html lang="sv">
      <body>
        {/* Header */}
        <header className="z-40 py-3 px-5 h-(--header-height)">
          {/* Logo */}
          <Link href="/" className="flex flex-row items-center gap-x-4 no-global">
            {/* Icon */}
            <Image
              width={64} height={64}
              className={`size-14 rounded-lg`}
              src="/icons/regeringen/regeringen.svg"
              alt="Logo"
              loading="eager"
            />

            {/* Title */}
            <p className="text-2xl font-medium title-font">Riksdagen</p>
          </Link>

          {/* Right group */}
          <div className="flex flex-row items-center justify-between gap-x-6 mr-1">
            {/* Account button */}
            <ClerkLogin nameSide="left" className="not-sm:hidden" />

            {/* Sidebar */}
            <Sidebar>
              <SidebarLink href="/">Hem</SidebarLink>
              <SidebarLink href="/ministrar">Våra ministrar</SidebarLink>
              <SidebarLink href="/statsskick">Statsskick</SidebarLink>
              <ProtectedLink href="/spotify" role="minister">Spotify-Statistik</ProtectedLink>
              <ExternalLink href="https://fil.riksdagen.net/">Fil-Departementet</ExternalLink>
              <ExternalLink href="https://vr-radio.tailad6f63.ts.net/">Venas Radio</ExternalLink>
            </Sidebar>
          </div>
        </header>

        {children}

        <Toaster theme="light" />

        <footer className="p-3 mt-5">
          <p>© 2025 Vena Ström, Axel Thornberg & Emil Winroth</p>
        </footer>
      </body>
    </html>
  </ClerkProvider>)
}