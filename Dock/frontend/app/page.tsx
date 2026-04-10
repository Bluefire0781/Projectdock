import Image from "next/image";

export default function Home() {
    return (
        //main div
        <div className="min-h-screen flex flex-col bg-white">
            <header className="bg-[#013c59] h-[12vh] w-full">
                <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
                    <div className="text-[#b5b500] font-extrabold leading-tight">
                        <div className="text-3xl tracking-wide">BSB</div>
                        <div className="text-3xl tracking-wide px-7 ">DockIT</div>
                    </div>

                    {/* CENTER: Nav and Button Wrapper */}
                    <div className="flex items-center gap-8">
                        <nav className="text-white font-medium flex gap-8">
                            <a href="#" className="hover:text-[#b5b500] transition">News</a>
                            <a href="#" className="hover:text-[#b5b500] transition">Dashboard</a>
                        </nav>

                        {/* Login Button */}
                        <a href="/login" className="bg-[#b5b500] text-[#013c59] font-semibold px-4 py-2 rounded-md hover:opacity-90 transition">
                            Login
                        </a>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center">
            </main>
        </div>
    );
}
