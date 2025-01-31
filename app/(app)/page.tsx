"use client";

import { useSearchParams } from "next/navigation";
import ministerWall from "./(components)/minister-wall";
import { useEffect } from "react";

export default function Page() {
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get("oauth") === "success") {
            const discordLoginButton = document.getElementById("discord-login-button-in-header");

            if (discordLoginButton) {
                discordLoginButton.innerHTML = discordLoginButton.innerHTML.replace("Login", "Logged in") || "Login";
            }
        }
    });

    return (
        <main>
            <h1 className="mt-14">Välkommen till Riksdagen</h1>
            <p className="mt-2 text-xl text-center">Det här är den så kallade <span className="italic">Regeringens</span> samlingswebbsida för allt möjligt</p>

            {ministerWall}
        </main>
    )
}