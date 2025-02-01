import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";

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

export default async function RootLayout({ children }: {
    children: React.ReactNode
}) {
    return (
        <html lang="sv" className={openSans.className}>
            <body>
                {children}

                <footer className="p-3 mt-5">
                    <p>© 2025 Viggo Ström, Axel Thornberg & Emil Winroth</p>
                </footer>
            </body>
        </html>
    )
}