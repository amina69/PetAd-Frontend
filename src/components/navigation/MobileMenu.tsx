
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MAIN_NAV_LINKS, UTILITY_LINKS } from '../../config/navigationConfig';
import { HomeIcon, EyeIcon, ListIcon, HeartIcon, BellIcon, XIcon } from './NavigationIcons';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    avatarUrl?: string;
    notificationCount?: number;
  };
  onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, user, onLogout }) => {
  const location = useLocation();

  if (!isOpen) return null;

  const isActive = (path: string) => location.pathname === path;

  // Helper to get icon component
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
    <div 
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 flex flex-col bg-white/95 backdrop-blur-md transition-all duration-300 ease-in-out border-t border-gray-100 top-16 sm:top-20 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="flex-1 overflow-y-auto py-4 px-6 space-y-6">
        {/* Main Links */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Navigation</p>
          {MAIN_NAV_LINKS.map((link) => {
            const Icon = getIcon(link.icon || '');
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Utility Links */}
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</p>
          
          <Link
            to={UTILITY_LINKS.favourites.path}
            onClick={onClose}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              isActive(UTILITY_LINKS.favourites.path)
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <HeartIcon className="w-5 h-5" />
              <span>{UTILITY_LINKS.favourites.label}</span>
            </div>
          </Link>

          <Link
            to={UTILITY_LINKS.notifications.path}
            onClick={onClose}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              isActive(UTILITY_LINKS.notifications.path)
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <BellIcon className="w-5 h-5" />
              <span>{UTILITY_LINKS.notifications.label}</span>
            </div>
            {user.notificationCount ? (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {user.notificationCount}
              </span>
            ) : null}
          </Link>
        </div>

        {/* User Section */}
        <div className="pt-4 border-t border-gray-100">
           <div className="flex items-center space-x-3 px-4 mb-4">
              <img
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">View Profile</p>
              </div>
           </div>
           
           <button
             onClick={() => {
               onLogout();
               onClose();
             }}
             className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium"
           >
             <span>Log Out</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
