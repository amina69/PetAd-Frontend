import { Link, useLocation } from "react-router-dom";
import { House, Eye, List, Heart, ChevronDown, ClipboardList, MessageCircle } from "lucide-react";
import logo from "../../assets/logo.svg";
import owner from "../../assets/owner.png";
import { PendingApprovalBadge } from "../badges/PendingApprovalBadge";
import { useRoleGuard } from "../../hooks/useRoleGuard";
import { DeferredNotificationCentreDropdown } from "../notifications";
import { ThemeToggle } from "../theme-toggle";
import { FreighterWalletButton } from "../wallet/FreighterWalletButton";
import { Flag } from "../Flag";
import { useFlag } from "../../hooks/useFlag";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";

const baseNavLinks = [
  { label: "Home", path: "/home", icon: House },
  { label: "Interests", path: "/interests", icon: Eye },
  { label: "Listings", path: "/listings", icon: List },
  { label: "Messages", path: "/messages", icon: MessageCircle },
];

type NavLink = {
  label: string;
  path: string;
  icon: typeof House;
  hasBadge?: boolean;
};

export function Navbar() {
  const location = useLocation();
  const { canApprove, isAdmin } = useRoleGuard();
  const messagingEnabled = useFlag("messaging");
  const { t } = useTranslation();

  function getNavLabel(link: NavLink): string {
    if (link.path === "/home") return t("navigation.home");
    if (link.path === "/interests") return t("navigation.interests");
    if (link.path === "/listings") return t("navigation.listings");
    if (link.path === "/messages") return t("navigation.messages");
    return link.label;
  }

  const navLinks: NavLink[] = [
    ...baseNavLinks.filter(
      (link) => link.path !== "/messages" || messagingEnabled,
    ),
    ...(isAdmin
      ? [
          {
            label: "Applications",
            path: "/admin/applications",
            icon: ClipboardList,
          },
        ]
      : []),
    ...(canApprove
      ? [
          {
            label: "Approvals",
            path: isAdmin ? "/admin/approvals" : "/shelter/approvals",
            icon: ClipboardList,
            hasBadge: true,
          },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link to="/home" className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="w-8 h-8" />
        <div>
          <p className="font-black text-[18px] leading-none tracking-widest uppercase dark:text-white">
            PETAD
          </p>
          <p className="text-[9px] tracking-[0.5em] uppercase text-black/60 dark:text-gray-400">
            Pet Lovers
          </p>
        </div>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            location.pathname === link.path ||
            (link.path === "/messages" && location.pathname.startsWith("/messages/"));
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 text-[15px] font-medium transition-colors ${
                isActive ? "text-[#001323] dark:text-white" : "text-gray-500 hover:text-[#001323] dark:hover:text-white"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="inline-flex items-center gap-2">
                {getNavLabel(link)}
                {link.hasBadge ? <PendingApprovalBadge /> : null}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <label className="sr-only" htmlFor="language-select">
          {t("language")}
        </label>
        <select
          id="language-select"
          aria-label={t("language")}
          value={i18n.resolvedLanguage ?? "en"}
          onChange={(event) => void i18n.changeLanguage(event.target.value)}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>

        <Link
          to="/favourites"
          className="relative p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Heart size={20} />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-[#001323] dark:bg-blue-600 rounded-full">
            2
          </span>
        </Link>

        <Flag name="darkMode">
          <ThemeToggle />
        </Flag>

        <FreighterWalletButton />

        <DeferredNotificationCentreDropdown />

        <div className="flex items-center gap-3 ml-2 cursor-pointer group">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100">
            <img src={owner} alt="User Avatar" loading="lazy" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Good Morning!</p>
            <p className="text-[14px] text-[#001323] dark:text-white font-bold">Scarlet Johnson</p>
          </div>
          <ChevronDown size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </div>
      </div>
    </nav>
  );
}
