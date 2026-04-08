import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <div className="inline-block px-4 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300 mb-4">
            Beta creator tool
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            Clean links for
            <br />
            <span className="text-blue-500">YouTube creators.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Turn messy links into clean, trusted links that get more clicks.
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="text-left">
                <div className="text-sm text-gray-500 mb-2">Before:</div>
                <div className="bg-gray-950 border border-gray-800 rounded px-4 py-3 text-sm text-gray-400 font-mono break-all">
                  https://example.com/affiliate?ref=xyz123&campaign=spring2024&...
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="text-blue-500 w-6 h-6" />
              </div>

              <div className="text-left">
                <div className="text-sm text-gray-500 mb-2">After:</div>
                <div className="bg-gray-950 border border-blue-800 rounded px-4 py-3 text-sm text-blue-400 font-mono">
                  {window.location.host}/robert/best-plane
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Link
              to="/signup"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </div>

          <div className="pt-12">
            <p className="text-sm text-gray-500">
              Fast redirects. Simple tracking. Built for real use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
