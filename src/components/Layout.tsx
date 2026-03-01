import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, LogOut, User, MapPin, Grid, Image, List, HelpCircle, Menu, X } from 'lucide-react';
import TourComponent from './TourComponent';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [runTour, setRunTour] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-indigo-600">
            <Store className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight">Local Shop Discovery</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin" className="tour-admin-dashboard text-sm font-medium text-gray-600 hover:text-gray-900">Dashboard</Link>
                    <Link to="/admin/areas" className="tour-admin-areas text-sm font-medium text-gray-600 hover:text-gray-900">Areas</Link>
                    <Link to="/admin/shops" className="tour-admin-shops text-sm font-medium text-gray-600 hover:text-gray-900">Shops</Link>
                  </>
                )}
                {user.role === 'shop_owner' && (
                  <>
                    <Link to="/owner" className="tour-owner-dashboard text-sm font-medium text-gray-600 hover:text-gray-900">Dashboard</Link>
                    <Link to="/owner/profile" className="tour-owner-profile text-sm font-medium text-gray-600 hover:text-gray-900">Profile</Link>
                    <Link to="/owner/gallery" className="tour-owner-gallery text-sm font-medium text-gray-600 hover:text-gray-900">Gallery</Link>
                    <Link to="/owner/products" className="tour-owner-products text-sm font-medium text-gray-600 hover:text-gray-900">Products</Link>
                  </>
                )}
                {user.role === 'customer' && (
                  <>
                    <Link to="/home" className="tour-customer-home text-sm font-medium text-gray-600 hover:text-gray-900">Home</Link>
                    <Link to="/shops" className="tour-customer-shops text-sm font-medium text-gray-600 hover:text-gray-900">Shops</Link>
                  </>
                )}
                <button
                  onClick={() => setRunTour(true)}
                  className="flex items-center space-x-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 ml-4"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Tour</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm font-medium text-red-600 hover:text-red-700 ml-4"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-2 shadow-lg absolute w-full">
            {user ? (
              <div className="flex flex-col space-y-3">
                {user.role === 'admin' && (
                  <>
                    <Link onClick={closeMenu} to="/admin" className="block text-base font-medium text-gray-700 hover:text-indigo-600">Dashboard</Link>
                    <Link onClick={closeMenu} to="/admin/areas" className="block text-base font-medium text-gray-700 hover:text-indigo-600">Areas</Link>
                    <Link onClick={closeMenu} to="/admin/shops" className="block text-base font-medium text-gray-700 hover:text-indigo-600">Shops</Link>
                  </>
                )}
                {user.role === 'shop_owner' && (
                  <>
                    <Link onClick={closeMenu} to="/owner" className="block text-base font-medium text-gray-700 hover:text-indigo-600">Dashboard</Link>
                    <Link onClick={closeMenu} to="/owner/profile" className="block text-base font-medium text-gray-700 hover:text-indigo-600">Profile</Link>
                    <Link onClick={closeMenu} to="/owner/gallery" className="block text-base font-medium text-gray-700 hover:text-indigo-600">Gallery</Link>
                    <Link onClick={closeMenu} to="/owner/products" className="block text-base font-medium text-gray-700 hover:text-indigo-600">Products</Link>
                  </>
                )}
                {user.role === 'customer' && (
                  <>
                    <Link onClick={closeMenu} to="/home" className="block text-base font-medium text-gray-700 hover:text-indigo-600">Home</Link>
                    <Link onClick={closeMenu} to="/shops" className="block text-base font-medium text-gray-700 hover:text-indigo-600">Shops</Link>
                  </>
                )}
                <div className="pt-2 border-t border-gray-100 flex flex-col space-y-3">
                  <button
                    onClick={() => { closeMenu(); setRunTour(true); }}
                    className="flex items-center space-x-2 text-base font-medium text-indigo-600"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span>Tour</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-base font-medium text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                onClick={closeMenu}
                to="/login"
                className="flex items-center space-x-2 text-base font-medium text-gray-700 hover:text-indigo-600"
              >
                <User className="w-5 h-5" />
                <span>Login</span>
              </Link>
            )}
          </div>
        )}
      </header>

      {user && <TourComponent run={runTour} setRun={setRunTour} userRole={user.role} />}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Local Shop Discovery. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
