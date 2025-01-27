"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
    const path = usePathname();
    const upOneLevel = path.split("/").slice(0, -1).join("/");

    return (
        <main>
            <h1 className="mt-32 mb-3">404</h1>
            <h2>Vi har tappat bort den här sidan</h2>
            <Link className="mt-2" href={upOneLevel}>Återgå till Ministrar</Link>
        </main>
    );
}