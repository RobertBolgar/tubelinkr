import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { signOut: clerkSignOut } = useClerkAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await clerkSignOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-950 overflow-x-hidden">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center min-w-0">
              <Link to="/dashboard" className="text-xl font-bold text-white whitespace-nowrap">
                TubeLinkr
              </Link>
            </div>
            
            {user && (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-4">
                  <Link
                    to="/dashboard"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/links"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Links
                  </Link>
                  <Link
                    to="/links/new"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    New Link
                  </Link>
                  <Link
                    to="/analytics"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Analytics
                  </Link>
                  <Link
                    to="/settings"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Settings
                  </Link>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <span>@{user.username}</span>
                  </div>
                  
                  <button
                    onClick={handleSignOut}
                    className="text-gray-300 hover:text-white p-2 rounded-md"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="text-gray-300 hover:text-white p-2 rounded-md"
                  >
                    {mobileMenuOpen ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Menu className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {user && mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <Link
                to="/dashboard"
                onClick={handleNavClick}
                className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/links"
                onClick={handleNavClick}
                className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium"
              >
                Links
              </Link>
              <Link
                to="/links/new"
                onClick={handleNavClick}
                className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium"
              >
                New Link
              </Link>
              <Link
                to="/analytics"
                onClick={handleNavClick}
                className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium"
              >
                Analytics
              </Link>
              <Link
                to="/settings"
                onClick={handleNavClick}
                className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium"
              >
                Settings
              </Link>
              
              <div className="border-t border-gray-800 pt-4 mt-4">
                <div className="px-3 py-2 text-gray-300">
                  @{user.username}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="overflow-x-hidden">{children}</main>
    </div>
  );
}
