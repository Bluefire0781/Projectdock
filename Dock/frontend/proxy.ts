import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type AppRole = "admin" | "user" | "warehouse";

const routeRoleMap: Record<string, AppRole> = {
    "/admin": "admin",
    "/user": "user",
    "/warehouse": "warehouse",
};

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080";

function requiredRoleForPath(pathname: string): AppRole | null {
    for (const prefix of Object.keys(routeRoleMap)) {
        if (pathname.startsWith(prefix)) return routeRoleMap[prefix];
    }
    return null;
}

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const requiredRole = requiredRoleForPath(pathname);
    if (!requiredRole) return NextResponse.next();

    // If no token cookie at all, go login
    if (!request.cookies.get("token")?.value) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        // Forward ALL incoming cookies, not only token
        const incomingCookieHeader = request.headers.get("cookie") ?? "";

        const res = await fetch(`${API_BASE}/me`, {
            method: "GET",
            headers: {
                cookie: incomingCookieHeader,
                accept: "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const claims = await res.json();
        const userRole = String(claims?.role ?? "") as AppRole;

        if (userRole !== requiredRole) {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

export const config = {
    matcher: ["/admin/:path*", "/user/:path*", "/warehouse/:path*"],
};
