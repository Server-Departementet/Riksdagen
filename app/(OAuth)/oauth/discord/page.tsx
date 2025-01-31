"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function DiscordOAuthPage() {
    const searchParams = useSearchParams();
    const route = useRouter();

    useEffect(() => {
        fetch("http://localhost:4000/api/oauth/discord", {
            method: "POST",
            body: JSON.stringify({ code: searchParams.get("code") }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(response => {
                if (!response.ok) throw new Error("Network response was not ok");

                return response.json();
            })
            .then(data => {
                console.info("Success:", data);

                // Redirect to home page
                route.push("/?oauth=success");
            })
            .catch(error => {
                console.error("Error:", error);
            });
    });

    return (
        <main>
            <p className="mt-4">Redirecting...</p>
        </main>
    )
}