import { Link } from 'react-router-dom';
import { ArrowRight, Flame, TrendingUp, BarChart3 } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="text-center space-y-6 sm:space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Stop guessing which links get clicks.
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            See exactly which placements drive clicks — and double down on what works.
          </p>

          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            Built for YouTube creators optimizing their description, pinned comments, and bio links.
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="space-y-4 sm:space-y-5">
              <div className="text-left">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Before</div>
                <div className="bg-gray-950 border border-gray-800 rounded px-4 py-3 text-xs sm:text-sm text-gray-400 font-mono break-all">
                  https://example.com/affiliate?ref=xyz123&campaign=spring...
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="text-left">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">After</div>
                <div className="bg-gray-950 border border-blue-800 rounded px-4 py-3 text-xs sm:text-sm text-blue-400 font-mono break-all">
                  {window.location.host}/robert/best-plane
                </div>
              </div>

              <div className="pt-4 sm:pt-5 border-t border-gray-800">
                <div className="text-left">
                  <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Results</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-white">Description</span>
                      </div>
                      <span className="text-base font-bold text-white">62%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-sm text-gray-300">Pinned</span>
                      </div>
                      <span className="text-sm font-semibold text-white">25%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-sm text-gray-300">Direct</span>
                      </div>
                      <span className="text-sm font-semibold text-white">13%</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-xs text-gray-400 italic">
                      Now you know exactly what's working.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg px-4 py-3 max-w-xl mx-auto">
            <p className="text-sm text-gray-400">
              Most creators are optimizing the wrong link placement.
            </p>
          </div>

          <p className="text-sm text-gray-500 pt-2">
            Find your best-performing placement in under 30 seconds.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-2">
            <Link
              to="/signup"
              className="px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center"
            >
              Create your first tracked link
            </Link>
            <Link
              to="/login"
              className="px-6 sm:px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-center"
            >
              Sign in
            </Link>
          </div>

          <p className="text-xs text-gray-500 pt-1">
            Takes less than 30 seconds to create your first tracked link
          </p>

          <div className="pt-6 sm:pt-8 space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <span>•</span>
              <span>Track clicks by placement</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <span>•</span>
              <span>Instantly see your best-performing link</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <span>•</span>
              <span>Optimize your YouTube funnel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
