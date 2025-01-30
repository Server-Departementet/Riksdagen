"use client";

import { useSearchParams } from "next/navigation";

export default function DiscordOAuthPage() {
    const oauthCode = useSearchParams().get("code");

    fetch("http://localhost:4000/api/oauth/discord", {
        method: "POST",
        body: JSON.stringify({ code: oauthCode }),
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(response => {
            if (!response.ok) {
                console.error("Error:", response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Success:", data);
        })
        .catch(error => {
            console.error("Error:", error);
        });

    return (
        <main>
            <p className="mt-4">Redirecting...</p>
        </main>
    )
}