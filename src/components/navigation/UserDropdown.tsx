
import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { USER_MENU_LINKS } from '../../config/navigationConfig';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: {
    name: string;
    avatarUrl?: string;
  };
}

const UserDropdown: React.FC<UserDropdownProps> = ({ isOpen, onClose, onLogout, user }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50 origin-top-right transition-all duration-200 ease-out"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
    >
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
        <p className="text-xs text-gray-500 truncate">Signed in</p>
      </div>

      <div className="py-1">
        <Link
          to={USER_MENU_LINKS.profile.path}
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          role="menuitem"
          onClick={onClose}
        >
          {USER_MENU_LINKS.profile.label}
        </Link>
        
        <button
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          role="menuitem"
        >
          {USER_MENU_LINKS.logout.label}
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;
