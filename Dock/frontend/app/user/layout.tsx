import type { Metadata } from "next";
import "../globals.css";
import LogoutButton from "../components/logoutbutton";

export const metadata: Metadata = {
    title: "Admin",
    description: "Admin dashboard",
};

export default function userLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <header className="bg-[#013c59] h-[12vh] w-full">
                <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
                    <div className="text-[#b5b500] font-extrabold leading-tight">
                        <div className="text-3xl tracking-wide">BSB</div>
                        <div className="text-3xl tracking-wide px-7">DockIT</div>
                    </div>

                    <div className="flex items-center gap-8">
                        <nav className="text-white font-medium flex gap-8">
                            <a href="/user/news" className="hover:text-[#b5b500] transition">news</a>
                            <a href="/user/afspraak" className="hover:text-[#b5b500] transition">afspraak</a>
                        </nav>

                        <LogoutButton />
                    </div>
                </div>
            </header>

            {children}
        </div>
    );
}
