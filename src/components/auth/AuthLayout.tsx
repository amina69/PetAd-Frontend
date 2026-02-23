import type { ReactNode } from "react";
import petsHero from "../../assets/pet.png";
import logo from "../../assets/logo.svg"

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="h-screen flex flex-col md:flex-row p-4 overflow-hidden">
      {/* ── Left panel — hidden on mobile, visible md+ ── */}
      <div className="hidden md:flex flex-col justify-between w-[46%] max-w-[660px] bg-[#FAD9C1] px-12 pt-14 rounded-lg overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <img src={logo} alt="Logo" />
          <div>
            <p className="font-black text-[20px] leading-none tracking-widest uppercase">
              PETAD
            </p>
            <p className="text-[10px] tracking-[0.5em] uppercase text-black/60">
              Pet Lovers
            </p>
          </div>
        </div>

        {/* Headline */}
        <div>
          <h1 className="font-black text-5xl lg:text-[50px]  leading-tight tracking-tight text-black ">
            Connecting Pet Lovers ❤️ For Easier Adoption!
          </h1>
          <p className="mt-4 text-base font-bold text-black/70 max-w-xl leading-relaxed">
            List your pets for adoption or discover pets/animals listed for
            adoption by their owners.
          </p>
        </div>

        {/* Pet image — large, anchored to bottom */}
        <div className="flex justify-center items-end w-full flex-1">
          <img
            src={petsHero}
            alt="A dog, cat and bird together"
            className="w-full object-cover object-bottom drop-shadow-lg"
          />
        </div>
      </div>

      {/* ── Right panel — full width on mobile, flex-1 on md+ ── */}
      <div className="flex flex-1 items-center justify-center min-h-screen px-6 py-12 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
