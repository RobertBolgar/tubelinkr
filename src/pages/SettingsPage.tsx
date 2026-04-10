import { useState } from 'react';
import { useAuth as useAppAuth } from '../contexts/AuthContext';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { Layout } from '../components/Layout';

export function SettingsPage() {
  const { user } = useAppAuth();
  const { user: clerkUser } = useClerkUser();
  const [username, setUsername] = useState(user?.username || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) {
      return 'Username is required';
    }
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 30) {
      return 'Username must be at most 30 characters';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (username === user?.username) {
      setError('Username is the same as current');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users/username', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, clerk_user_id: clerkUser?.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update username');
      }

      await response.json();
      setSuccess(true);
      
      // Refresh user data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Username</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50"
                placeholder="Enter new username"
              />
              <p className="mt-1 text-xs text-gray-500">
                3-30 characters, letters, numbers, underscores, and hyphens only
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-3 rounded-lg text-sm">
                Username updated successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Updating...' : 'Update Username'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400">
              <strong>Note:</strong> Your username is used in your public links (e.g., tubelinkr.com/{user.username}/slug). Changing your username will change your public link URLs, but your existing links will still work.
            </p>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
}
