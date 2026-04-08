import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sentMagicLink, setSentMagicLink] = useState('');
  const { sendMagicLink, verifyMagicLink } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle magic link token from URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleVerifyToken(token);
    }
  }, [searchParams]);

  const handleVerifyToken = async (token: string) => {
    setLoading(true);
    setError('');
    
    const { error: verifyError } = await verifyMagicLink(token);
    
    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: sendError, magicLink } = await sendMagicLink(email);

    if (sendError) {
      setError(sendError.message);
      setLoading(false);
      return;
    }

    setMagicLinkSent(true);
    if (magicLink) {
      setSentMagicLink(magicLink);
    }
    setLoading(false);
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Check your email</h2>
            <p className="mt-2 text-gray-400">
              We sent a magic link to <strong className="text-white">{email}</strong>
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-4">
              Click the link in your email to sign in. The link will expire in 15 minutes.
            </p>
            
            {sentMagicLink && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Demo - click this link:</p>
                <a 
                  href={sentMagicLink}
                  className="text-blue-400 text-sm break-all hover:text-blue-300"
                >
                  {sentMagicLink}
                </a>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-gray-400">
            <button 
              onClick={() => setMagicLinkSent(false)}
              className="text-blue-500 hover:text-blue-400 font-medium"
            >
              Use a different email
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Welcome back</h2>
          <p className="mt-2 text-gray-400">Sign in with your email</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Send magic link'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-500 hover:text-blue-400 font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
