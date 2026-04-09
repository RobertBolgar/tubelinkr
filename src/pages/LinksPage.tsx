import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, Link as LinkType } from '../lib/cloudflare';
import { Layout } from '../components/Layout';
import { Plus, CreditCard as Edit, Copy, CheckCircle2, ExternalLink } from 'lucide-react';

type LinkWithClicks = LinkType & {
  clicks: number;
};

export function LinksPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkWithClicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

      if (linkIds.length > 0) {
        const clickEvents = await db.getClickEventsByLinkIds(linkIds);

        clickEvents?.forEach((event) => {
          clickCounts[event.link_id] = (clickCounts[event.link_id] || 0) + 1;
        });
      }

      const linksWithClicks = links.map((link) => ({
        ...link,
        clicks: clickCounts[link.id] || 0,
      }));

      setLinks(linksWithClicks);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (linkId: string, slug: string) => {
    const url = `${window.location.origin}/${user?.username}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Links</h1>
            <p className="text-gray-400 mt-2">{links.length} total links</p>
          </div>
          <Link
            to="/links/new"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Public URL:</span>
                        <div className="text-sm text-gray-500 font-mono">
                          {window.location.origin}/{user?.username}/{link.slug}
                        </div>
                        <button
                          onClick={() => copyToClipboard(link.id, link.slug)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedId === link.id ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Destination:</span>
                        <a
                          href={link.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 truncate max-w-lg"
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
                          onClick={() => copyToClipboard(link.id + '-d', `${window.location.origin}/api/redirect/${link.id}/${link.slug}?source=d`)}
                          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                        >
                          Description
                        </button>
                        <button
                          onClick={() => copyToClipboard(link.id + '-p', `${window.location.origin}/api/redirect/${link.id}/${link.slug}?source=p`)}
                          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                        >
                          Pinned
                        </button>
                        <button
                          onClick={() => copyToClipboard(link.id + '-b', `${window.location.origin}/api/redirect/${link.id}/${link.slug}?source=b`)}
                          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                        >
                          Bio
                        </button>
                        <button
                          onClick={() => copyToClipboard(link.id + '-s1', `${window.location.origin}/api/redirect/${link.id}/${link.slug}?source=s1`)}
                          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                        >
                          Short 1
                        </button>
                        <button
                          onClick={() => copyToClipboard(link.id + '-v1', `${window.location.origin}/api/redirect/${link.id}/${link.slug}?source=v1`)}
                          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                        >
                          Video 1
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="enter custom code"
                          className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const customCode = e.currentTarget.value.trim().toLowerCase();
                              if (customCode) {
                                copyToClipboard(link.id + '-' + customCode, `${window.location.origin}/api/redirect/${link.id}/${link.slug}?source=${customCode}`);
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <span className="text-xs text-gray-500">Press Enter to copy custom variant</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                      <span>{link.clicks} clicks</span>
                      <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/links/${link.id}/edit`}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => toggleLinkStatus(link.id, link.is_active)}
                      className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
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
