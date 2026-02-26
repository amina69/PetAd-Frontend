
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MAIN_NAV_LINKS, UTILITY_LINKS } from '../../config/navigationConfig';
import { HomeIcon, EyeIcon, ListIcon, HeartIcon, BellIcon, ChevronDownIcon, MenuIcon, XIcon } from './NavigationIcons';
import UserDropdown from './UserDropdown';
import MobileMenu from './MobileMenu';

interface User {
  name: string;
  avatarUrl?: string;
  notificationCount?: number;
}

interface TopNavProps {
  user?: User;
  onLogout?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ 
  user = { 
    name: 'Guest User', 
    avatarUrl: undefined, 
    notificationCount: 0 
  }, 
  onLogout = () => console.log('Logout clicked') 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [location.pathname]);

  // Close mobile menu on resize (desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  // Icon mapping helper
  const getIcon = (name: string) => {
    switch (name) {
      case 'Home': return HomeIcon;
      case 'Eye': return EyeIcon;
      case 'List': return ListIcon;
      case 'Heart': return HeartIcon;
      case 'Bell': return BellIcon;
      default: return HomeIcon;
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center cursor-pointer">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/Brand Logo.svg" 
                alt="PetAd Logo" 
                className="h-8 w-auto sm:h-10 transition-transform duration-300 hover:scale-105" 
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {MAIN_NAV_LINKS.map((link) => {
              const Icon = getIcon(link.icon || '');
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`group flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out ${
                    active
                      ? 'bg-gray-900 text-white shadow-md transform scale-105'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-900'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Section: Utilities + User */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-6">
            
            {/* Utility Icons */}
            <div className="flex items-center space-x-2 lg:space-x-4 border-r border-gray-200 pr-4 lg:pr-6">
              <Link
                to={UTILITY_LINKS.favourites.path}
                className="group relative p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                aria-label="Favourites"
              >
                <HeartIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
              </Link>

              <Link
                to={UTILITY_LINKS.notifications.path}
                className="group relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                aria-label="Notifications"
              >
                <BellIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
                {user.notificationCount && user.notificationCount > 0 ? (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {user.notificationCount > 9 ? '9+' : user.notificationCount}
                  </span>
                ) : null}
              </Link>
            </div>

            {/* User Dropdown Section */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-3 p-1 pl-2 pr-3 rounded-full hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-expanded={isUserDropdownOpen}
                aria-haspopup="true"
              >
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover shadow-sm ring-2 ring-white"
                />
                <div className="hidden lg:flex flex-col items-start text-left">
                  <span className="text-xs text-gray-400 font-medium">Good Morning!</span>
                  <span className="text-sm font-semibold text-gray-800 leading-none">{user.name}</span>
                </div>
                <ChevronDownIcon 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              <UserDropdown
                isOpen={isUserDropdownOpen}
                onClose={() => setIsUserDropdownOpen(false)}
                onLogout={onLogout}
                user={user}
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <XIcon className="h-7 w-7" />
              ) : (
                <MenuIcon className="h-7 w-7" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onLogout={onLogout}
      />
    </nav>
  );
};

export default TopNav;
