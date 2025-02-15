import "./global.scss";
import { Open_Sans } from "next/font/google";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { loginButton, userButtonSkeleton } from "./components/login-button";

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

const openSans = Open_Sans({
    subsets: ["latin"],
});

export default async function AppLayout({ children }: {
    children: React.ReactNode
}) {
    return (<ClerkProvider>
        <html lang="sv" className={openSans.className}>
            <body>
                {/* Header */}
                <header className="p-3 px-5 items-center">
                    {/* Logo */}
                    <div className="flex flex-row">
                        <Link href="/" className="flex flex-row items-center gap-x-4 no-underline">
                            <Image width={64} height={64} className="size-[3.5rem] rounded-lg text-" src="/icons/header-logo.png" alt="Logo" />

                            <p className="text-2xl font-medium">Riksdagen</p>
                        </Link>
                    </div>

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