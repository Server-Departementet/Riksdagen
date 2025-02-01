import "./global.scss";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

// Discord OAuth link
const discordOAuthLink = process.env.ENV === "server" ?
    "https://discord.com/oauth2/authorize?client_id=1222824481571999856&response_type=code&redirect_uri=https%3A%2F%2Fserver-riksdagen.tailad6f63.ts.net%2Fapi%2Foauth%2Fdiscord&scope=identify"
    :
    "https://discord.com/oauth2/authorize?client_id=1222824481571999856&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Foauth%2Fdiscord&scope=identify"
    ;

export default async function AppLayout({ children }: {
    children: React.ReactNode
}) {
    return (<>
        {/* Header */}
        <header className="p-3 px-5 items-center">
            {/* Logo */}
            <div className="flex flex-row">
                <Link href="/" className="flex flex-row items-center gap-x-4 no-underline">
                    <Image width={64} height={64} className="size-[3.5rem] rounded-lg" src="/icons/header-logo.png" alt="Logo" />

                    <p className="text-2xl font-medium">Riksdagen</p>
                </Link>
            </div>

            {/* Discord Login */}
            <Link href={discordOAuthLink} id="discord-login-button-in-header" className="flex flex-row items-center justify-center gap-x-2 px-3 py-2 bg-[#5865f2] text-white rounded-lg font-bold no-underline hover:text-white hover:drop-shadow-lg">
                <Image width={24} height={24} src="/icons/discord-mark-white.svg" alt="Discord"></Image>
                Login
            </Link>
        </header>

        <div className="flex-1">
            <Suspense>
                {children}
            </Suspense>
        </div>
    </>)
}