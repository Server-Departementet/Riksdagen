import "./global.scss";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Open_Sans } from "next/font/google";
import type { Metadata } from "next";
import { loginButton, loggedInButton } from "./(components)/login-button";

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
                        <SignInButton children={loginButton} />
                    </SignedOut>
                    <SignedIn>
                        {/* <UserButton appearance={{ layout: { shimmer: false }, elements: { userButtonBox: "px-2 pe-3 py-2 bg-[#5865f2] rounded-lg", userButtonAvatarBox: "size-8", userButtonOuterIdentifier: "text-white font-normal text-base" } }} showName /> */}
                        <UserButton children={loggedInButton} />
                    </SignedIn>
                </header>

                <div className="flex-1">
                    <Suspense>
                        {children}
                    </Suspense>
                </div>
            </body>
        </html>
    </ClerkProvider>)
}