import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AddPlacementModal } from '../components/AddPlacementModal';
import { Copy, CheckCircle2, Plus, ArrowLeft, Trash2, RefreshCw } from 'lucide-react';

const PUBLIC_BASE_URL = 'https://go.tubelinkr.com';

type Placement = {
  id: number;
  link_id: number;
  name: string;
  type: string;
  source_code: string;
  created_at: string;
  updated_at: string;
  clicks: number;
};

type LinkInfo = {
  id: string;
  slug: string;
  title?: string;
  original_url: string;
  username: string;
};

export function PlacementsPage() {
  const { linkId } = useParams<{ linkId: string }>();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (linkId) {
      fetchPlacements();
      fetchLinkInfo();
    }
  }, [linkId]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!linkId) return;

    const interval = setInterval(() => {
      fetchPlacements();
    }, 15000);

    return () => clearInterval(interval);
  }, [linkId]);

  // Refetch when tab becomes visible or gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && linkId) {
        fetchPlacements();
      }
    };

    const handleFocus = () => {
      if (linkId) {
        fetchPlacements();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [linkId]);

  const fetchPlacements = async () => {
    if (!linkId) return;

    try {
      const response = await fetch(`/api/placements?link_id=${linkId}`);
      const data = await response.json();
      setPlacements(data);
    } catch (error) {
      console.error('Error fetching placements:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchPlacements();
  };

  const fetchLinkInfo = async () => {
    if (!linkId) return;

    try {
      const response = await fetch(`/api/links/${linkId}`);
      const data = await response.json();
      setLinkInfo(data);
    } catch (error) {
      console.error('Error fetching link info:', error);
    }
  };

  const handleAddPlacement = async (placement: { name: string; type: string; source_code: string }) => {
    try {
      const response = await fetch('/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...placement, link_id: linkId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add placement');
      }

      fetchPlacements();
    } catch (error) {
      throw error;
    }
  };

  const handleDeletePlacement = async (placementId: number) => {
    if (!confirm('Are you sure you want to delete this placement?')) return;

    try {
      const response = await fetch(`/api/placements?id=${placementId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete placement');
      }

      fetchPlacements();
    } catch (error) {
      console.error('Error deleting placement:', error);
      alert('Failed to delete placement');
    }
  };

  const copyPlacementUrl = (placement: Placement) => {
    const url = `${PUBLIC_BASE_URL}/${linkInfo?.username}/${linkInfo?.slug}?source=${placement.source_code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(placement.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      description: 'Description',
      pinned: 'Pinned Comment',
      bio: 'Bio',
      short: 'Short',
      video: 'Video',
      other: 'Other',
      direct: 'Direct',
    };
    return labels[type] || type;
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
          <Link
            to="/links"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Links
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Performance for {linkInfo?.title || linkInfo?.slug}
          </h1>
          <p className="text-gray-400">{placements.length} placements tracked</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh stats"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh stats'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Track new placement
          </button>
        </div>

        {placements.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">No placements tracked yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Track your first placement
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Tracking code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {placements.map((placement) => (
                    <tr key={placement.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{placement.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">{getTypeLabel(placement.type)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{placement.clicks}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400 font-mono">{placement.source_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {placement.type === 'direct' ? (
                          <div className="text-sm text-gray-500 italic">Virtual placement</div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyPlacementUrl(placement)}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                              title="Copy tracking link"
                            >
                              {copiedId === placement.id ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeletePlacement(placement.id)}
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete placement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showAddModal && (
          <AddPlacementModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddPlacement}
          />
        )}
      </div>
    </Layout>
  );
}
