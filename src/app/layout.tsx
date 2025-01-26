import "./global.scss";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

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

export default function RootLayout({ children }: {
    children: React.ReactNode
}) {
    return (
        <html lang="sv" className={openSans.className}>

            <body>
                <header className="p-3 ps-5">
                    <div className="flex flex-row items-center gap-x-4">
                        <Link href="/">
                            <Image width={64} height={64} className="size-[3.5rem] rounded-lg" src="/icons/header-logo.png" alt="Logo" />
                        </Link>

                        <p className="text-2xl font-medium">Regeringen</p>
                    </div>
                </header>

                {children}

                <footer className="p-3 mt-5">
                    <p>© 2025 Viggo Ström, Axel Thornberg & Emil Winroth</p>
                </footer>
            </body>
        </html>
    )
}