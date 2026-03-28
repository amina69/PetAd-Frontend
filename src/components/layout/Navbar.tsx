import { Link, useLocation } from "react-router-dom";
import { House, Eye, List, Heart, Bell, ChevronDown } from "lucide-react";
import logo from "../../assets/logo.svg";
import owner from "../../assets/owner.png";

const navLinks = [
  { label: "Home", path: "/home", icon: House },
  { label: "Interests", path: "/interests", icon: Eye },
  { label: "Listings", path: "/listings", icon: List },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <Link to="/home" className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="w-8 h-8" />
        <div>
          <p className="font-black text-[18px] leading-none tracking-widest uppercase">
            PETAD
          </p>
          <p className="text-[9px] tracking-[0.5em] uppercase text-black/60">
            Pet Lovers
          </p>
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 text-[15px] font-medium transition-colors ${
                isActive ? "text-[#001323]" : "text-gray-500 hover:text-[#001323]"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Action Icons and Profile */}
      <div className="flex items-center gap-4">
        {/* Favorite Icon with Badge */}
        <Link
          to="/favourites"
          className="relative p-2.5 bg-gray-50 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Heart size={20} />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-[#001323] rounded-full">
            2
          </span>
        </Link>

        {/* Notification Icon with Red Dot */}
        <Link
          to="/notifications"
          className="relative p-2.5 bg-gray-50 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-3 ml-2 cursor-pointer group">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100">
            <img src={owner} alt="User Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] text-gray-400 font-medium">Good Morning!</p>
            <p className="text-[14px] text-[#001323] font-bold">Scarlet Johnson</p>
          </div>
          <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </nav>
  );
}
