import { Suspense } from "react";

export default function OAuthLayout({ children }: {
    children: React.ReactNode
}) {
    return (<Suspense>
        {children}
    </Suspense>)
}
