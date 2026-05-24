import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold gradient-text">WA Gateway</span>
            </Link>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-sm !py-2 !px-4">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
