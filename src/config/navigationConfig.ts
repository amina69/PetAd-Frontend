
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

export const MAIN_NAV_LINKS: NavItem[] = [
  { label: 'Home', path: '/home', icon: 'Home' },
  { label: 'Interests', path: '/interests', icon: 'Eye' },
  { label: 'Listings', path: '/listings', icon: 'List' },
];

export const UTILITY_LINKS = {
  favourites: { label: 'Favourites', path: '/favourites', icon: 'Heart' },
  notifications: { label: 'Notifications', path: '/notifications', icon: 'Bell' },
};

export const USER_MENU_LINKS = {
  profile: { label: 'View Profile', path: '/profile' },
  logout: { label: 'Logout', action: 'logout' },
};
