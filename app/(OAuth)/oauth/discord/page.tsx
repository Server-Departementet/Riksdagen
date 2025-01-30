"use client";

import { useSearchParams } from "next/navigation";

export default function DiscordOAuthPage() {
    const oauthCode = useSearchParams().get("code");

    return (
        <main>
            <p className="mt-4">Redirecting...</p>
        </main>
    )
}