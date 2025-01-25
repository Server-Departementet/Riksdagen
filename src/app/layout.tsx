import "./global.scss";
import type { Metadata } from "next";
import Image from "next/image";
import { Open_Sans } from "next/font/google";

export const metadata: Metadata = {
    title: "Riksdagen",
    authors: [
        { name: "Viggo Ström", url: "https://viggostrom.github.io/" },
        { name: "Axel Thornberg", url: "https://axel.thornberg.se/" },
    ],
    description: "Samlingsplatsen för 'Regeringens' alla ärenden.",
    icons: {
        icon: "/icons/favicon.png",
    }
}

const openSans = Open_Sans({
    subsets: ["latin"],
});

export default function RootLayout({ children }: {
    children: React.ReactNode
}) {
    return (
        <html lang="sv" className={openSans.className}>

            <body>
                <header className="p-3 ps-5">
                    <Image width={64} height={64} className="size-[4rem] rounded-lg" src="/icons/header-logo.png" alt="Logo"/>
                </header>

                {children}

                <footer className="p-3">
                    <p>© 2025 Viggo Ström & Axel Thornberg</p>
                </footer>
            </body>
        </html>
    )
}