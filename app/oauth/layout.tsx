import { Open_Sans } from "next/font/google";

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

                <footer className="p-3 mt-5">
                    <p>© 2025 Viggo Ström, Axel Thornberg & Emil Winroth</p>
                </footer>
            </body>
        </html>
    )
}