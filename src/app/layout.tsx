import "./global.scss";
import type { Metadata } from "next";
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
                {children}
            </body>
        </html>
    )
}