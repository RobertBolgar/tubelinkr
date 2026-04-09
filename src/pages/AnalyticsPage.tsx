import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/cloudflare';
import { Layout } from '../components/Layout';
import { TrendingUp } from 'lucide-react';

type LinkStats = {
  id: string;
  title: string;
  slug: string;
  clicks: number;
};

type SourceStats = {
  source: string;
  clicks: number;
};

type RecentClick = {
  id: string;
  timestamp: string;
  link_title: string;
  link_slug: string;
  source: string | null;
  referrer: string | null;
};

const getSourceDisplay = (source: string | null): string => {
  if (!source || source === '' || source === 'NULL') return 'Direct';
  
  const sourceMap: Record<string, string> = {
    'd': 'Description',
    'p': 'Pinned Comment',
    'b': 'Bio',
    's1': 'Short 1',
    'v1': 'Video 1',
  };
  
  return sourceMap[source] || source.toUpperCase();
};

export function AnalyticsPage() {
  const { user } = useAuth();
  const [linkStats, setLinkStats] = useState<LinkStats[]>([]);
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  const [recentClicks, setRecentClicks] = useState<RecentClick[]>([]);
  const [last24hClicks, setLast24hClicks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      const links = await db.getLinksByUserId(user.id);

      if (!links || links.length === 0) {
        setLoading(false);
        return;
      }

      const linkIds = links.map((l) => l.id);

      const response = await db.getClickEventsByLinkIds(linkIds);
      
      // Handle new API response format
      const clickEvents = response.events || [];
      const totalClicks = response.totalClicks || 0;
      const bySource = response.bySource || [];

      if (clickEvents.length === 0) {
        setLoading(false);
        return;
      }

      const linkClickCounts: Record<string, number> = {};
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      let clicksLast24h = 0;

      clickEvents.forEach((event: any) => {
        linkClickCounts[event.link_id] = (linkClickCounts[event.link_id] || 0) + 1;

        const eventDate = new Date(event.timestamp);
        if (eventDate >= yesterday) {
          clicksLast24h++;
        }
      });

      // Use pre-calculated source analytics from API
      const sourceStats = bySource.length > 0 ? bySource : [];

      const linkStatsData = links
        .map((link) => ({
          id: link.id,
          title: link.title || link.slug,
          slug: link.slug,
          clicks: linkClickCounts[link.id] || 0,
        }))
        .sort((a, b) => b.clicks - a.clicks);

      const recentClicksData = clickEvents.slice(0, 50).map((event: any) => {
        const link = links.find((l) => l.id === event.link_id);
        return {
          id: event.id,
          timestamp: event.timestamp,
          link_title: link?.title || link?.slug || 'Unknown',
          link_slug: link?.slug || 'unknown',
          source: event.source,
          referrer: event.referrer,
        };
      });

      setLinkStats(linkStatsData);
      setSourceStats(sourceStats as SourceStats[]);
      setRecentClicks(recentClicksData);
      setLast24hClicks(clicksLast24h);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-2">Track your link performance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Last 24 Hours</h2>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-4xl font-bold text-white">{last24hClicks}</div>
            <div className="text-sm text-gray-500 mt-1">clicks</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Top Sources</h2>
            {sourceStats.length > 0 ? (
              <div className="space-y-3">
                {sourceStats.slice(0, 5).map((stat) => (
                  <div key={stat.source} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">
                      {getSourceDisplay(stat.source)}
                    </span>
                    <span className="text-white font-semibold">{stat.clicks}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No data yet</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Clicks by Link</h2>
            {linkStats.length > 0 ? (
              <div className="space-y-3">
                {linkStats.map((stat) => (
                  <div key={stat.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{stat.title}</div>
                      <div className="text-xs text-gray-500 font-mono truncate">
                        /{stat.slug}
                      </div>
                    </div>
                    <div className="ml-4 text-white font-semibold">{stat.clicks}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No links yet</p>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            {recentClicks.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentClicks.map((click) => (
                  <div
                    key={click.id}
                    className="text-sm border-b border-gray-800 pb-3 last:border-0"
                  >
                    <div className="text-white font-medium truncate">{click.link_title}</div>
                    <div className="text-xs text-gray-500 font-mono truncate">
                      /{click.link_slug}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(click.timestamp).toLocaleString()}
                    </div>
                    {click.source && (
                      <div className="text-xs text-blue-400 mt-1">
                        Source: {click.source}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
