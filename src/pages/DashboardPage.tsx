import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/cloudflare';
import { formatSourceLabel } from '../lib/utils';
import { Layout } from '../components/Layout';
import { ExternalLink, TrendingUp, Link as LinkIcon, Activity, Flame, Clock } from 'lucide-react';

type DashboardStats = {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  topLinks: Array<{
    id: string;
    title: string;
    slug: string;
    clicks: number;
  }>;
  sourceData: Array<{
    source: string | null;
    clicks: number;
  }>;
  mostRecentClick: {
    linkTitle: string;
    linkSlug: string;
    timestamp: string;
  } | null;
};

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLinks: 0,
    totalClicks: 0,
    activeLinks: 0,
    topLinks: [],
    sourceData: [],
    mostRecentClick: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      const links = await db.getLinksByUserId(user.id);

      const totalLinks = links?.length || 0;
      const activeLinks = links?.filter((l) => l.is_active).length || 0;

      const linkIds = links?.map((l) => l.id) || [];
      let totalClicks = 0;
      const linkClickCounts: Record<string, number> = {};

      let sourceData: Array<{ source: string | null; clicks: number }> = [];
      let mostRecentClick: { linkTitle: string; linkSlug: string; timestamp: string } | null = null;

      if (linkIds.length > 0) {
        const response = await db.getClickEventsByLinkIds(linkIds);
        const clickEvents = response.events || [];
        totalClicks = response.totalClicks || 0;
        sourceData = response.bySource || [];

        clickEvents.forEach((event) => {
          linkClickCounts[event.link_id] = (linkClickCounts[event.link_id] || 0) + 1;
        });

        // Get most recent click
        if (clickEvents.length > 0) {
          const sortedEvents = [...clickEvents].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          const mostRecent = sortedEvents[0];
          const link = links?.find((l) => l.id === mostRecent.link_id);
          if (link) {
            mostRecentClick = {
              linkTitle: link.title || link.slug,
              linkSlug: link.slug,
              timestamp: mostRecent.timestamp,
            };
          }
        }
      }

      const topLinks = links
        ?.map((link) => ({
          id: link.id,
          title: link.title || link.slug,
          slug: link.slug,
          clicks: linkClickCounts[link.id] || 0,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5) || [];

      setStats({
        totalLinks,
        totalClicks,
        activeLinks,
        topLinks,
        sourceData,
        mostRecentClick,
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBestLink = () => {
    if (stats.topLinks.length === 0) return null;
    return stats.topLinks[0];
  };

  const getBestSource = () => {
    if (stats.sourceData.length === 0) return null;
    const sorted = [...stats.sourceData].sort((a, b) => b.clicks - a.clicks);
    return sorted[0];
  };

  const getAverageClicksPerLink = () => {
    if (stats.totalLinks === 0) return 0;
    return (stats.totalClicks / stats.totalLinks).toFixed(1);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Welcome back, @{user?.username}</p>
        </div>

        {/* What's Working Right Now */}
        {stats.totalClicks > 0 && (() => {
          const bestLink = getBestLink();
          const bestSource = getBestSource();
          const totalSourceClicks = stats.sourceData.reduce((sum, s) => sum + s.clicks, 0);
          const bestSourcePercent = bestSource && totalSourceClicks > 0 
            ? Math.round((bestSource.clicks / totalSourceClicks) * 100) 
            : 0;
          
          if (!bestLink || !bestSource) return null;
          
          const suggestions: Record<string, string> = {
            'Direct': 'Your direct traffic is strong - consider sharing more on social media',
            'Description': 'Focus on description placement for this link',
            'Pinned Comment': 'Your pinned comments are performing well - keep using them',
            'Bio': 'Your channel bio is driving clicks - keep it updated',
            'Short 1': 'Your short videos are converting well',
            'Video 1': 'Your video content is effective',
          };
          
          const suggestion = suggestions[formatSourceLabel(bestSource.source)] || 'Keep using this placement';
          
          return (
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-5 sm:p-6 mb-6 sm:mb-8 shadow-lg">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="text-base sm:text-lg font-bold text-white">What's Working Right Now</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">🔥 Best Performing Link</div>
                  <div className="text-white font-semibold sm:font-medium text-sm sm:text-base truncate">{bestLink.title}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">📊 Top Source</div>
                  <div className="text-white font-semibold sm:font-medium text-sm sm:text-base">
                    {formatSourceLabel(bestSource.source)} ({bestSourcePercent}%)
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">💡 Suggestion</div>
                  <div className="text-white font-semibold sm:font-medium text-sm sm:text-base">{suggestion}</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Overall Performance */}
        {stats.sourceData.length > 0 && (() => {
          const totalSourceClicks = stats.sourceData.reduce((sum, s) => sum + s.clicks, 0);
          if (totalSourceClicks === 0) return null;
          
          const sortedSources = [...stats.sourceData].sort((a, b) => b.clicks - a.clicks);
          const topSource = sortedSources[0];
          const topSourceLabel = formatSourceLabel(topSource.source);
          
          return (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sm:p-6 mb-6 sm:mb-8 shadow-lg">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h2 className="text-base sm:text-lg font-bold text-white">Overall Performance</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-3 font-medium">Source Breakdown</div>
                  <div className="space-y-2.5">
                    {sortedSources.slice(0, 5).map((source) => {
                      const percent = Math.round((source.clicks / totalSourceClicks) * 100);
                      return (
                        <div key={source.source || 'null'} className="flex items-center justify-between py-1">
                          <span className="text-gray-300 text-sm font-medium">
                            {formatSourceLabel(source.source)}
                          </span>
                          <span className="text-white font-bold">{percent}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="bg-gray-800/50 rounded-lg p-4 sm:p-5 border border-gray-700/50 w-full max-w-sm">
                    <div className="text-xs sm:text-sm text-gray-400 mb-2">💡 Insight</div>
                    <div className="text-white font-semibold sm:font-medium text-sm sm:text-base text-center">
                      {topSourceLabel} is your top performing placement
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gray-900 border border-gray-800/50 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="text-gray-400 text-xs sm:text-sm font-medium">Total Links</div>
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalLinks}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800/50 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="text-gray-400 text-xs sm:text-sm font-medium">Total Clicks</div>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalClicks}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800/50 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="text-gray-400 text-xs sm:text-sm font-medium">Active Links</div>
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.activeLinks}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800/50 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="text-gray-400 text-xs sm:text-sm font-medium">Avg Clicks/Link</div>
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {getAverageClicksPerLink()}
            </div>
          </div>
        </div>

        {stats.totalLinks > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Best Link */}
            {(() => {
              const bestLink = getBestLink();
              if (bestLink && bestLink.clicks > 0) {
                return (
                  <div className="bg-gray-900 border border-gray-800/50 rounded-xl p-4 sm:p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-white">Best Link</h3>
                      <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                    </div>
                    <div className="text-white font-semibold sm:font-medium text-sm sm:text-base mb-2 truncate">{bestLink.title}</div>
                    <div className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{bestLink.clicks} clicks</div>
                    <div className="text-xs text-gray-400">Top performing link</div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Best Source */}
            {(() => {
              const bestSource = getBestSource();
              const totalSourceClicks = stats.sourceData.reduce((sum, s) => sum + s.clicks, 0);
              if (bestSource && totalSourceClicks > 0) {
                return (
                  <div className="bg-gray-900 border border-gray-800/50 rounded-xl p-4 sm:p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-white">Best Source</h3>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    </div>
                    <div className="text-white font-semibold sm:font-medium text-sm sm:text-base mb-2">{formatSourceLabel(bestSource.source)}</div>
                    <div className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{bestSource.clicks} clicks</div>
                    <div className="text-xs text-gray-400">Best placement</div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Most Recent Activity */}
            {stats.mostRecentClick && (
              <div className="bg-gray-900 border border-gray-800/50 rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-white">Recent Activity</h3>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <div className="text-white font-semibold sm:font-medium text-sm sm:text-base mb-2 truncate">{stats.mostRecentClick.linkTitle}</div>
                <div className="text-xs sm:text-sm text-gray-400 font-mono mb-1 sm:mb-2 break-all">
                  /{stats.mostRecentClick.linkSlug}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(stats.mostRecentClick.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800/50 rounded-xl p-5 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white">Top Links</h2>
            <Link to="/links" className="text-blue-500 hover:text-blue-400 text-sm font-medium whitespace-nowrap">
              View all
            </Link>
          </div>

          {stats.totalLinks === 0 ? (
            <div className="text-center py-10 sm:py-12">
              <p className="text-gray-400 mb-4 text-sm sm:text-base">No links yet</p>
              <Link
                to="/links/new"
                className="inline-block px-5 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
              >
                Create your first link
              </Link>
            </div>
          ) : stats.totalClicks === 0 ? (
            <div className="text-center py-10 sm:py-12">
              <p className="text-gray-400 mb-4 text-sm sm:text-base">No click data yet</p>
              <p className="text-sm text-gray-500">Share your links to start tracking clicks</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {stats.topLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3 sm:mr-4">
                    <div className="text-white font-semibold sm:font-medium text-sm sm:text-base truncate mb-1">{link.title}</div>
                    <div className="text-xs sm:text-sm text-gray-400 font-mono break-all">
                      {window.location.host}/{user?.username}/{link.slug}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl sm:text-2xl font-bold text-white">{link.clicks}</div>
                    <div className="text-xs text-gray-400">clicks</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
