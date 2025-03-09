import "@/app/global.tw.css";
import { Manrope, Open_Sans } from "next/font/google";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { loginButton, userButtonSkeleton } from "@/components/login-button";

/* Used in global css */
const _manrope = Manrope({ subsets: ["latin"] });
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

export default async function AppLayout({ children }: {
  children: React.ReactNode
}) {
  return (<ClerkProvider>
    <html lang="sv">
      <body>
        {/* Header */}
        <header className="p-3 px-5 items-center">
          {/* Logo */}
          <Link href="/" className="flex flex-row items-center gap-x-4 no-underline hover:text-inherit">
            {/* Icon */}
            <Image width={64} height={64} className="size-[3.5rem] rounded-lg text-" src="/icons/header-logo.png" alt="Logo" />

            {/* Title */}
            <p className="text-2xl font-medium">Riksdagen</p>
          </Link>

          <SignedOut>
            <SignInButton>
              {loginButton}
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton fallback={userButtonSkeleton} showName appearance={{
              layout: { shimmer: false }, elements: {
                userButtonBox: "me-1 gap-3",
                userButtonAvatarBox: "size-10",
                userButtonOuterIdentifier: "text-white text-base font-normal",
              }
            }} />
          </SignedIn>
        </header>

        {children}

        <footer className="p-3 mt-5">
          <p>© 2025 Viggo Ström, Axel Thornberg & Emil Winroth</p>
        </footer>
      </body>
    </html>
  </ClerkProvider>)
}