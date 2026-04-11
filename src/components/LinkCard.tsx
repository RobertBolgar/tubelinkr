import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link as LinkType } from '../lib/cloudflare';
import { Copy, CheckCircle2, ExternalLink, Plus, List } from 'lucide-react';

type LinkWithStats = LinkType & {
  clicks: number;
  bestPlacement?: { name: string; type: string; clicks: number } | null;
};

interface LinkCardProps {
  link: LinkWithStats;
  username?: string;
  onToggleStatus: (linkId: string, currentStatus: boolean) => void;
  onAddPlacement: (linkId: string) => void;
  onViewPlacements: (linkId: string) => void;
}

const PUBLIC_BASE_URL = 'https://go.tubelinkr.com';

export function LinkCard({ link, username, onToggleStatus, onAddPlacement, onViewPlacements }: LinkCardProps) {
  const [copied, setCopied] = useState(false);

  const getPublicUrl = (slug: string): string => {
    return `${PUBLIC_BASE_URL}/${username}/${slug}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getPublicUrl(link.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      <div className="flex flex-col gap-4">
        {/* Header with title and status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white truncate">
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
        </div>

        {/* Destination URL */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 whitespace-nowrap">Destination:</span>
          <a
            href={link.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 truncate"
          >
            {link.original_url}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>

        {/* Main public link with copy button */}
        <div className="flex items-center gap-2 bg-gray-950 rounded-lg p-3">
          <span className="text-sm text-gray-400 whitespace-nowrap">Public Link:</span>
          <div className="text-sm text-gray-300 font-mono flex-1 min-w-0 truncate">
            {getPublicUrl(link.slug)}
          </div>
          <button
            onClick={copyToClipboard}
            className="p-1.5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
            title="Copy public link"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Total Clicks:</span>
            <span className="text-white font-medium">{link.clicks}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Where you used it:</span>
            <span className="text-white font-medium">{link.placement_count || 0}</span>
          </div>
          {link.bestPlacement && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Top performing:</span>
              <span className="text-white font-medium">{link.bestPlacement.name}</span>
              <span className="text-gray-400">({link.bestPlacement.clicks} clicks)</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => onAddPlacement(link.id)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Track new placement
          </button>
          <button
            type="button"
            onClick={() => onViewPlacements(link.id)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <List className="w-4 h-4" />
            View performance
          </button>
          <Link
            to={`/links/${link.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Edit Link
          </Link>
          <button
            type="button"
            onClick={() => onToggleStatus(link.id, link.is_active)}
            className="px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-800 text-sm font-medium rounded-lg transition-colors"
          >
            Delete Link
          </button>
        </div>
      </div>
    </div>
  );
}
