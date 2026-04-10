import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
    title: "Login",
    description: "Sign in",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-100">
            <header className="bg-[#013c59] h-24 w-full px-6 flex items-center">
                <div className="text-[#b5b500] font-extrabold leading-tight">
                    <div className="text-3xl">BSB</div>
                    <div className="text-3xl pl-7">DockIT</div>
                </div>
            </header>
            {children}
        </div>
    );
}
