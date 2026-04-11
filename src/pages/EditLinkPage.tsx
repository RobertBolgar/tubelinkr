import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, Link as LinkType } from '../lib/cloudflare';
import { Layout } from '../components/Layout';
import { AlertTriangle } from 'lucide-react';

export function EditLinkPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [link, setLink] = useState<LinkType | null>(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [slugChanged, setSlugChanged] = useState(false);

  console.log('EditLinkPage rendered with id:', id);

  useEffect(() => {
    console.log('EditLinkPage useEffect triggered, fetching link with id:', id);
    fetchLink();
  }, [id]);

  const fetchLink = async () => {
    if (!id) {
      console.log('fetchLink: No id provided');
      return;
    }

    console.log('fetchLink: Fetching link with id:', id, 'current user.id:', user?.id);
    try {
      const link = await db.getLinkById(id);
      console.log('fetchLink: Received link data:', link, 'link.user_id:', link?.user_id, 'type:', typeof link?.user_id);
      
      if (!link) {
        console.log('fetchLink: Link not found, navigating to /links');
        navigate('/links');
        return;
      }

      // Fix type mismatch: link.user_id is number, user.id is string
      if (String(link.user_id) !== String(user?.id)) {
        console.log('fetchLink: User mismatch - link.user_id:', link.user_id, 'user.id:', user?.id, 'navigating to /links');
        navigate('/links');
        return;
      }

      console.log('fetchLink: Link found, setting state');
      setLink(link);
      setOriginalUrl(link.original_url);
      setTitle(link.title || '');
      setSlug(link.slug);
      setIsActive(link.is_active);
      setFetchLoading(false);
    } catch (error) {
      console.error('fetchLink: Error fetching link:', error);
      navigate('/links');
    }
  };

  const sanitizeSlug = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeSlug(e.target.value);
    setSlug(sanitized);
    setSlugChanged(sanitized !== link?.slug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('handleSubmit called with:', { id, originalUrl, title, slug, isActive });

    if (!originalUrl) {
      setError('Original URL is required');
      return;
    }

    try {
      new URL(originalUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    if (slug.length < 2) {
      setError('Slug must be at least 2 characters');
      return;
    }

    setLoading(true);

    try {
      if (slugChanged) {
        console.log('Checking for existing links with slug:', slug);
        const existingLinks = await db.getLinksByUserId(user!.id);
        const existingLink = existingLinks.find((l) => l.slug === slug && l.id !== id);

        if (existingLink) {
          console.log('Slug already exists, showing error');
          setError('A link with this slug already exists');
          setLoading(false);
          return;
        }
      }

      console.log('Calling db.updateLink with:', id!, { original_url: originalUrl, title: title || null, slug, is_active: isActive });
      await db.updateLink(id!, {
        original_url: originalUrl,
        title: title || null,
        slug: slug,
        is_active: isActive,
      });
      console.log('db.updateLink successful, navigating to /links');

      navigate('/links');
    } catch (error: any) {
      console.error('handleSubmit error:', error);
      setError(error.message || 'Failed to update link');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Edit Link</h1>
          <p className="text-gray-400 mt-2">Update your link settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {slugChanged && (
            <div className="bg-yellow-900/20 border border-yellow-800 text-yellow-400 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium mb-1">Warning: URL will change</div>
                <div>
                  Changing the slug will change your public URL. Links already shared in videos,
                  descriptions, or comments will break.
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-300 mb-2">
              Destination URL *
            </label>
            <input
              id="originalUrl"
              name="originalUrl"
              type="url"
              required
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="https://example.com/your-long-url"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Title (optional)
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="My Awesome Product"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">
              Slug
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">{window.location.host}/{user?.username}/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                className="flex-1 min-w-0 px-3 sm:px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="my-link"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 bg-gray-900 border border-gray-800 rounded text-blue-600 focus:ring-2 focus:ring-blue-600"
              />
              <div>
                <div className="text-sm font-medium text-gray-300">Active</div>
                <div className="text-xs text-gray-500">
                  Inactive links will show a not-found page
                </div>
              </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate('/links')}
              className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
