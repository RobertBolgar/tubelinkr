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
  const [placementMap, setPlacementMap] = useState<Record<string, string>>({});

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

      // Fetch placements to map source codes to names
      const newPlacementMap: Record<string, string> = {};
      if (linkIds.length > 0) {
        try {
          // Fetch placements for all links
          const placementPromises = linkIds.map(linkId => 
            fetch(`/api/placements?link_id=${linkId}`)
              .then(res => res.ok ? res.json() : [])
              .catch(() => [])
          );
          const allPlacements = await Promise.all(placementPromises);
          allPlacements.flat().forEach((p: { source_code: string; name: string }) => {
            newPlacementMap[p.source_code] = p.name;
          });
          setPlacementMap(newPlacementMap);
        } catch (error) {
          console.error('Error fetching placements:', error);
        }
      }

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

  const formatSourceLabelWithPlacements = (source: string | null) => {
    if (!source) return 'Direct';
    // Check if source code has a placement name
    if (placementMap[source]) {
      return placementMap[source];
    }
    // Fallback to original formatSourceLabel
    return formatSourceLabel(source);
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

        {/* What's Working Right Now - Compact focused panel */}
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
          
          const suggestion = suggestions[formatSourceLabelWithPlacements(bestSource.source)] || 'Keep using this placement';
          
          return (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-lg">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                <h2 className="text-sm sm:text-base font-bold text-white">What's Working Right Now</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">🔥 Best Link</div>
                  <div className="text-white font-semibold text-sm truncate">{bestLink.title}</div>
                </div>
                <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">📊 Top Source</div>
                  <div className="text-white font-semibold text-sm">
                    {formatSourceLabelWithPlacements(bestSource.source)} ({bestSourcePercent}%)
                  </div>
                </div>
                <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">💡 Suggestion</div>
                  <div className="text-white font-semibold text-sm leading-tight">{suggestion}</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Overall Performance - Ranked breakdown with progress bars */}
        {stats.sourceData.length > 0 && (() => {
          const totalSourceClicks = stats.sourceData.reduce((sum, s) => sum + s.clicks, 0);
          if (totalSourceClicks === 0) return null;
          
          const sortedSources = [...stats.sourceData].sort((a, b) => b.clicks - a.clicks);
          const topSource = sortedSources[0];
          const topSourceLabel = formatSourceLabelWithPlacements(topSource.source);
          const topSourcePercent = Math.round((topSource.clicks / totalSourceClicks) * 100);
          
          return (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  <h2 className="text-sm sm:text-base font-bold text-white">Overall Performance</h2>
                </div>
                <div className="text-xs text-gray-400">{totalSourceClicks} total clicks</div>
              </div>
              <div className="space-y-3">
                {sortedSources.slice(0, 5).map((source, index) => {
                  const percent = Math.round((source.clicks / totalSourceClicks) * 100);
                  return (
                    <div key={source.source || 'null'} className="space-y-1">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-mono">#{index + 1}</span>
                          <span className="text-gray-300 font-medium">{formatSourceLabelWithPlacements(source.source)}</span>
                        </div>
                        <span className="text-white font-semibold">{percent}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="text-xs text-gray-400 mb-1">💡 Top Insight</div>
                <div className="text-sm text-white font-medium">
                  {topSourceLabel} drives {topSourcePercent}% of your traffic — optimize this placement
                </div>
              </div>
            </div>
          );
        })()}

        {/* Stat Cards - Compact secondary hierarchy */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="bg-gray-900 border border-gray-800/30 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-500 text-xs font-medium">Total Links</div>
              <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.totalLinks}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800/30 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-500 text-xs font-medium">Total Clicks</div>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.totalClicks}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800/30 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-500 text-xs font-medium">Active Links</div>
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.activeLinks}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800/30 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-500 text-xs font-medium">Avg/Link</div>
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {getAverageClicksPerLink()}
            </div>
          </div>
        </div>

        {/* Secondary Cards - Tertiary hierarchy */}
        {stats.totalLinks > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5">
            {/* Best Link */}
            {(() => {
              const bestLink = getBestLink();
              if (bestLink && bestLink.clicks > 0) {
                return (
                  <div className="bg-gray-900 border border-gray-800/30 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white">Best Link</h3>
                      <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                    </div>
                    <div className="text-white font-semibold text-sm mb-1 truncate">{bestLink.title}</div>
                    <div className="text-lg sm:text-xl font-bold text-white mb-1">{bestLink.clicks} clicks</div>
                    <div className="text-xs text-gray-500">Top performing</div>
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
                  <div className="bg-gray-900 border border-gray-800/30 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white">Best Source</h3>
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                    </div>
                    <div className="text-white font-semibold text-sm mb-1">{formatSourceLabelWithPlacements(bestSource.source)}</div>
                    <div className="text-lg sm:text-xl font-bold text-white mb-1">{bestSource.clicks} clicks</div>
                    <div className="text-xs text-gray-500">Best placement</div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Most Recent Activity */}
            {stats.mostRecentClick && (
              <div className="bg-gray-900 border border-gray-800/30 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white">Recent Activity</h3>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                </div>
                <div className="text-white font-semibold text-sm mb-1 truncate">{stats.mostRecentClick.linkTitle}</div>
                <div className="text-xs text-gray-400 font-mono mb-1 break-all">
                  /{stats.mostRecentClick.linkSlug}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(stats.mostRecentClick.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Links - Compact data list */}
        <div className="bg-gray-900 border border-gray-800/30 rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-white">Top Links</h2>
            <Link to="/links" className="text-blue-500 hover:text-blue-400 text-xs font-medium whitespace-nowrap">
              View all
            </Link>
          </div>

          {stats.totalLinks === 0 ? (
            <div className="text-center py-8 sm:py-10">
              <p className="text-gray-400 mb-3 text-sm">No links yet</p>
              <Link
                to="/links/new"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Create your first link
              </Link>
            </div>
          ) : stats.totalClicks === 0 ? (
            <div className="text-center py-8 sm:py-10">
              <p className="text-gray-400 mb-2 text-sm">No click data yet</p>
              <p className="text-xs text-gray-500">Share your links to start tracking</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.topLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-2.5 bg-gray-800/40 border border-gray-700/30 rounded hover:bg-gray-800/60 transition-colors"
                >
                  <div className="text-gray-600 font-mono text-xs w-5 flex-shrink-0">#{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate mb-0.5">{link.title}</div>
                    <div className="text-xs text-gray-500 font-mono truncate">
                      /{user?.username}/{link.slug}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-lg font-bold text-white">{link.clicks}</div>
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
