
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import TopNav from '../navigation/TopNav';
import Footer from '../footer/Footer';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Implement logout logic here (clear tokens, etc.)
    console.log('Logging out...');
    navigate('/login');
  };

  // Mock user data - in a real app, this would come from a context or prop
  const user = {
    name: 'Scarlet Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    notificationCount: 2,
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <TopNav user={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
