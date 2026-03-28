import { ArrowUp } from "lucide-react";
import logo from "../../assets/logo.svg";
import pawsImg from "../../assets/paws.svg";

interface PawIconProps {
  className?: string;
}

function PawIcon({ className = "" }: PawIconProps) {
  return (
    <img src={pawsImg} alt="Paw background pattern" className={className} />
  );
}

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full bg-white pt-20 pb-12 overflow-hidden border-t border-gray-100">
      {/* Background Paw Pattern — Matching Screenshot */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Far left paw */}
        <PawIcon className="absolute w-[180px] h-[180px] -bottom-12 -left-10 rotate-[15deg] opacity-[0.25]" />

        {/* Left-center cluster */}
        <PawIcon className="absolute w-[140px] h-[140px] -bottom-6 left-[15%] rotate-[-10deg] opacity-[0.2]" />
        <PawIcon className="absolute w-[160px] h-[160px] -bottom-16 left-[28%] rotate-[25deg] opacity-[0.22]" />

        {/* Center area */}
        <PawIcon className="absolute w-[150px] h-[150px] -bottom-10 left-[45%] rotate-[-5deg] opacity-[0.18]" />
        <PawIcon className="absolute w-[130px] h-[130px] -bottom-4 left-[58%] rotate-[15deg] opacity-[0.25]" />

        {/* Right-center cluster */}
        <PawIcon className="absolute w-[170px] h-[170px] -bottom-14 left-[72%] rotate-[-20deg] opacity-[0.2]" />
        <PawIcon className="absolute w-[140px] h-[140px] -bottom-8 left-[85%] rotate-[10deg] opacity-[0.22]" />

        {/* Far right paw */}
        <PawIcon className="absolute w-[180px] h-[180px] -bottom-12 -right-10 rotate-[35deg] opacity-[0.25]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Logo and Copyright */}
        <div className="flex flex-col items-center md:items-start gap-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <div>
              <p className="font-black text-[18px] leading-none tracking-widest uppercase text-[#001323]">
                PETAD
              </p>
              <p className="text-[9px] tracking-[0.5em] uppercase text-black/60">
                Pet Lovers
              </p>
            </div>
          </div>
          <p className="text-[14px] text-gray-500 font-medium">
            All rights reserved! Petad 2026
          </p>
        </div>

        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className="p-4 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-700 transition-all hover:scale-110 active:scale-95 group"
          aria-label="Scroll to top"
        >
          <ArrowUp
            size={24}
            className="group-hover:-translate-y-1 transition-transform"
          />
        </button>
      </div>
    </footer>
  );
}
