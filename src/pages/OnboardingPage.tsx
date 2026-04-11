import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Check, AlertCircle } from 'lucide-react';

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Prefill with existing username
    if (user.username) {
      setUsername(user.username);
    }
  }, [user, navigate]);

  const validateUsername = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Username is required';
    }
    
    const trimmed = value.trim().toLowerCase();
    
    // Check allowed characters (letters, numbers, underscores, hyphens)
    if (!/^[a-z0-9_-]+$/.test(trimmed)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    // Check length
    if (trimmed.length < 3) {
      return 'Username must be at least 3 characters';
    }
    
    if (trimmed.length > 30) {
      return 'Username must be less than 30 characters';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const trimmedUsername = username.trim().toLowerCase();
    setLoading(true);
    
    try {
      const response = await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: trimmedUsername,
          clerk_user_id: user?.clerk_user_id 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm username');
      }
      
      // Redirect to dashboard after successful onboarding
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to TubeLinkr</h1>
              <p className="text-gray-400">Choose your username to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-username"
                  disabled={loading}
                />
                {error && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* URL Preview */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Your links will look like:</div>
                <div className="text-white font-mono text-sm break-all">
                  go.tubelinkr.com/{username.toLowerCase()}/your-link
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Continue to Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                You can change your username later in Settings
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
