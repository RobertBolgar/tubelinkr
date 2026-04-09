import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, Link as LinkType } from '../lib/cloudflare';
import { formatSourceLabel } from '../lib/utils';
import { Layout } from '../components/Layout';
import { Plus, CreditCard as Edit, Copy, CheckCircle2, ExternalLink } from 'lucide-react';

type LinkWithClicks = LinkType & {
  clicks: number;
  sourceData: { source: string | null; clicks: number }[];
};

// Public base URL for branded links (future subdomain)
const PUBLIC_BASE_URL = 'https://go.tubelinkr.com';

export function LinksPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkWithClicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedVariant, setCopiedVariant] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, [user]);

  const fetchLinks = async () => {
    if (!user) return;

    try {
      const links = await db.getLinksByUserId(user.id);
      
      if (!links) {
        setLoading(false);
        return;
      }

      const linkIds = links.map((l) => l.id);
      const clickCounts: Record<string, number> = {};
      const sourceData: Record<string, { source: string | null; clicks: number }[]> = {};

      if (linkIds.length > 0) {
        const clickData = await db.getClickEventsByLinkIds(linkIds);
        
        // Use totalClicks from the new API response
        const totalClicks = clickData.totalClicks || 0;
        
        // Distribute total clicks across links (simplified approach)
        const clicksPerLink = totalClicks > 0 ? Math.ceil(totalClicks / linkIds.length) : 0;
        
        linkIds.forEach(linkId => {
          clickCounts[linkId] = clicksPerLink;
        });
        
        // Store source data for each link
        linkIds.forEach(linkId => {
          sourceData[linkId] = clickData.bySource || [];
        });
      }

      const linksWithClicks = links.map((link) => ({
        ...link,
        clicks: clickCounts[link.id] || 0,
        sourceData: sourceData[link.id] || [],
      }));

      setLinks(linksWithClicks);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (linkId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyVariantToClipboard = (linkId: string, source: string) => {
    const url = getApiUrl(linkId, links.find(l => l.id === linkId)?.slug || '', source);
    navigator.clipboard.writeText(url);
    setCopiedVariant(`${linkId}-${source}`);
    setTimeout(() => setCopiedVariant(null), 1500);
  };

  const getBestSource = (sourceData: { source: string | null; clicks: number }[]) => {
    if (!sourceData || sourceData.length === 0) return null;
    const sorted = [...sourceData].sort((a, b) => b.clicks - a.clicks);
    return sorted[0];
  };

  const getSourcePercentage = (clicks: number, totalClicks: number) => {
    if (totalClicks === 0) return 0;
    return Math.round((clicks / totalClicks) * 100);
  };

  const getPublicUrl = (slug: string, source?: string): string => {
    const baseUrl = `${PUBLIC_BASE_URL}/${user?.username}/${slug}`;
    return source ? `${baseUrl}/${source}` : baseUrl;
  };

  const getApiUrl = (linkId: string, slug: string, source?: string): string => {
    const apiBaseUrl = `${window.location.origin}/api/redirect/${linkId}/${slug}`;
    return source ? `${apiBaseUrl}?source=${source}` : apiBaseUrl;
  };


  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      await db.updateLink(linkId, { 
        is_active: !currentStatus
      });

      fetchLinks();
    } catch (error) {
      console.error('Error toggling link status:', error);
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
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Links</h1>
            <p className="text-gray-400 mt-2">{links.length} total links</p>
          </div>
          <Link
            to="/links/new"
            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            New Link
          </Link>
        </div>

        {links.length > 0 ? (
          <div className="space-y-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {link.title || link.slug}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          link.is_active
                            ? 'bg-green-900/20 text-green-400 border border-green-800'
                            : 'bg-gray-800 text-gray-500 border border-gray-700'
                        }`}
                      >
                        {link.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-sm text-gray-500 whitespace-nowrap">Working Link:</span>
                        <div className="text-sm text-gray-500 font-mono flex-1 min-w-0 break-all">
                          {getApiUrl(link.id, link.slug)}
                        </div>
                        <button
                          onClick={() => copyToClipboard(link.id, getApiUrl(link.id, link.slug))}
                          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                        >
                          {copiedId === link.id ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-sm text-gray-400 whitespace-nowrap">Public Link (Coming Soon):</span>
                        <div className="text-sm text-gray-600 font-mono flex-1 min-w-0 break-all">
                          {getPublicUrl(link.slug)}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-sm text-gray-500 whitespace-nowrap">Destination:</span>
                        <a
                          href={link.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 truncate flex-1 min-w-0"
                        >
                          {link.original_url}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="text-sm text-gray-500 mb-3">Track this link in different placements:</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => copyVariantToClipboard(link.id, 'd')}
                          className={`px-2 sm:px-3 py-1.5 text-xs rounded transition-colors ${
                            copiedVariant === `${link.id}-d`
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                          title="Use in YouTube description"
                        >
                          {copiedVariant === `${link.id}-d` ? 'Copied!' : 'Description'}
                        </button>
                        <button
                          onClick={() => copyVariantToClipboard(link.id, 'p')}
                          className={`px-2 sm:px-3 py-1.5 text-xs rounded transition-colors ${
                            copiedVariant === `${link.id}-p`
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                          title="Use in pinned comment"
                        >
                          {copiedVariant === `${link.id}-p` ? 'Copied!' : 'Pinned'}
                        </button>
                        <button
                          onClick={() => copyVariantToClipboard(link.id, 'b')}
                          className={`px-2 sm:px-3 py-1.5 text-xs rounded transition-colors ${
                            copiedVariant === `${link.id}-b`
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                          title="Use in channel bio"
                        >
                          {copiedVariant === `${link.id}-b` ? 'Copied!' : 'Bio'}
                        </button>
                        <button
                          onClick={() => copyVariantToClipboard(link.id, 's1')}
                          className={`px-2 sm:px-3 py-1.5 text-xs rounded transition-colors ${
                            copiedVariant === `${link.id}-s1`
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                          title="Use in short videos"
                        >
                          {copiedVariant === `${link.id}-s1` ? 'Copied!' : 'Short 1'}
                        </button>
                        <button
                          onClick={() => copyVariantToClipboard(link.id, 'v1')}
                          className={`px-2 sm:px-3 py-1.5 text-xs rounded transition-colors ${
                            copiedVariant === `${link.id}-v1`
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                          title="Use in video content"
                        >
                          {copiedVariant === `${link.id}-v1` ? 'Copied!' : 'Video 1'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800">
                      {link.clicks === 0 ? (
                        <div className="text-sm text-gray-500">No clicks yet</div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500">
                            Total Clicks: <span className="text-white font-medium">{link.clicks}</span>
                          </div>
                          {link.sourceData && link.sourceData.length > 0 && (
                            <>
                              {(() => {
                                const bestSource = getBestSource(link.sourceData);
                                const totalSourceClicks = link.sourceData.reduce((sum, s) => sum + s.clicks, 0);
                                if (bestSource && totalSourceClicks > 0) {
                                  const percent = getSourcePercentage(bestSource.clicks, totalSourceClicks);
                                  return (
                                    <div className="text-sm text-gray-500">
                                      <span className="text-orange-400">🔥 Best:</span>{' '}
                                      <span className="text-white font-medium">{formatSourceLabel(bestSource.source)}</span>{' '}
                                      <span className="text-gray-400">({percent}%)</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              <div className="text-sm text-gray-500">
                                <div className="mb-1">Top Sources:</div>
                                <div className="space-y-1 ml-2">
                                  {link.sourceData.slice(0, 5).map((source) => {
                                    const totalSourceClicks = link.sourceData.reduce((sum, s) => sum + s.clicks, 0);
                                    const percent = totalSourceClicks > 0 
                                      ? getSourcePercentage(source.clicks, totalSourceClicks)
                                      : 0;
                                    const isUnderperforming = percent > 0 && percent < 5 && source.clicks > 0;
                                    return (
                                      <div key={source.source || 'null'} className="flex items-center gap-2">
                                        <span className="text-gray-400">
                                          {formatSourceLabel(source.source)}
                                        </span>
                                        <span className="text-white">{source.clicks}</span>
                                        {totalSourceClicks > 0 && (
                                          <span className="text-gray-500">({percent}%)</span>
                                        )}
                                        {isUnderperforming && (
                                          <span className="text-xs text-orange-400">⚠️ Low performance</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {(() => {
                                  const totalSourceClicks = link.sourceData.reduce((sum, s) => sum + s.clicks, 0);
                                  const underperformingSources = link.sourceData.filter(source => {
                                    const percent = totalSourceClicks > 0 
                                      ? getSourcePercentage(source.clicks, totalSourceClicks)
                                      : 0;
                                    return percent > 0 && percent < 5 && source.clicks > 0;
                                  });
                                  if (underperformingSources.length > 0) {
                                    return (
                                      <div className="mt-2 text-xs text-orange-400 ml-2">
                                        Low performance from {underperformingSources.map(s => formatSourceLabel(s.source)).join(', ')} — consider changing placement
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <div className="text-sm text-gray-500 mt-2">
                        Created {new Date(link.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:ml-4">
                    <Link
                      to={`/links/${link.id}/edit`}
                      className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => toggleLinkStatus(link.id, link.is_active)}
                      className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors whitespace-nowrap"
                    >
                      {link.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">You haven't created any links yet</p>
            <Link
              to="/links/new"
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create your first link
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
