import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-950 overflow-x-hidden">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center min-w-0">
              <Link to="/dashboard" className="text-xl font-bold text-white whitespace-nowrap">
                TubeLinkr
              </Link>
            </div>
            
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  Dashboard
                </Link>
                <Link
                  to="/links"
                  className="text-gray-300 hover:text-white px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  Links
                </Link>
                <Link
                  to="/links/new"
                  className="text-gray-300 hover:text-white px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  New Link
                </Link>
                <Link
                  to="/analytics"
                  className="text-gray-300 hover:text-white px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  Analytics
                </Link>
                
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-300 whitespace-nowrap">
                  <span>@{user.username}</span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-white p-2 rounded-md"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="overflow-x-hidden">{children}</main>
    </div>
  );
}
