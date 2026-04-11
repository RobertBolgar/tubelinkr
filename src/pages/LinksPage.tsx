import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, Link as LinkType } from '../lib/cloudflare';
import { Layout } from '../components/Layout';
import { LinkCard } from '../components/LinkCard';
import { AddPlacementModal } from '../components/AddPlacementModal';
import { Plus } from 'lucide-react';

type LinkWithClicks = LinkType & {
  clicks: number;
};

export function LinksPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkWithClicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

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
        const clickData = await db.getClickEventsByLinkIds(linkIds);
        
        // Use totalClicks from the new API response
        const totalClicks = clickData.totalClicks || 0;
        
        // Distribute total clicks across links (simplified approach)
        const clicksPerLink = totalClicks > 0 ? Math.ceil(totalClicks / linkIds.length) : 0;
        
        linkIds.forEach(linkId => {
          clickCounts[linkId] = clicksPerLink;
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

  const handleAddPlacement = (linkId: string) => {
    setSelectedLinkId(linkId);
    setShowAddModal(true);
  };

  const handleAddPlacementSubmit = async (placement: { name: string; type: string; source_code: string }) => {
    try {
      const response = await fetch('/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...placement, link_id: selectedLinkId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add placement');
      }

      fetchLinks();
    } catch (error) {
      throw error;
    }
  };

  const handleViewPlacements = (linkId: string) => {
    window.location.href = `/links/${linkId}/placements`;
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
              <LinkCard
                key={link.id}
                link={link}
                username={user?.username}
                onToggleStatus={toggleLinkStatus}
                onAddPlacement={handleAddPlacement}
                onViewPlacements={handleViewPlacements}
              />
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

      {showAddModal && (
        <AddPlacementModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPlacementSubmit}
        />
      )}
    </Layout>
  );
}
