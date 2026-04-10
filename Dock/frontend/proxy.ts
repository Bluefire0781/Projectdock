import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

type AppRole = "admin" | "user" | "warehouse";

const routeRoleMap: Record<string, AppRole> = {
    "/admin": "admin",
    "/user": "user",
    "/warehouse": "warehouse",
};

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

    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.redirect(new URL("/login", request.url));

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userRole = String(payload.role ?? "") as AppRole;

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
