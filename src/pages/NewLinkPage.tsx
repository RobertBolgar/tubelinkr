import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/cloudflare';
import { Layout } from '../components';

export function NewLinkPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [originalUrl, setOriginalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sanitizeSlug = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const generateSlugFromTitle = (titleText: string): string => {
    return sanitizeSlug(titleText).slice(0, 50);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeSlug(e.target.value);
    setSlug(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

    let finalSlug = slug;
    if (!finalSlug && title) {
      finalSlug = generateSlugFromTitle(title);
    }

    if (!finalSlug) {
      setError('Please provide a title or custom slug');
      return;
    }

    if (finalSlug.length < 2) {
      setError('Slug must be at least 2 characters');
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const existingLinks = await db.getLinksByUserId(user.id);
      const existingLink = existingLinks.find((l) => l.slug === finalSlug);

      if (existingLink) {
        setError('A link with this slug already exists');
        setLoading(false);
        return;
      }

      await db.createLink({
        user_id: user.id,
        slug: finalSlug,
        original_url: originalUrl,
        title: title || undefined,
      });

      navigate('/links');
    } catch (error: any) {
      setError(error.message || 'Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Create New Link</h1>
          <p className="text-gray-400 mt-2">Transform your messy URL into a clean, shareable link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-300 mb-2">
              Original URL *
            </label>
            <input
              type="url"
              id="originalUrl"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://example.com/very/long/url?with=parameters&more=stuff"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Link"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">
              Custom Slug (optional)
            </label>
            <div className="flex">
              <div className="inline-flex items-center px-3 bg-gray-800 border border-r-0 border-gray-700 rounded-l-lg text-gray-400">
                {window.location.host}/{user?.username}/
              </div>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={handleSlugChange}
                placeholder="my-link"
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-r-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Only lowercase letters, numbers, and hyphens allowed. Min 2 characters.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/links')}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
