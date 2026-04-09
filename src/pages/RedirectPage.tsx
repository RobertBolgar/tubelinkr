import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { db } from '../lib/cloudflare';

export function RedirectPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    handleRedirect();
  }, [username, slug]);

  const hashString = async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleRedirect = async () => {
    if (!username || !slug) {
      setNotFound(true);
      return;
    }

    try {
      const user = await db.getUserByUsername(username);
      
      if (!user) {
        setNotFound(true);
        return;
      }

      const link = await db.getLinkByUserAndSlug(user.id, slug);

      if (!link) {
        setNotFound(true);
        return;
      }

      // Track click event
      const source = searchParams.get('src');
      const referrer = document.referrer || null;
      const userAgent = navigator.userAgent || null;

      let ipHash: string | null = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        if (ipData.ip) {
          ipHash = await hashString(ipData.ip);
        }
      } catch (error: any) {
        console.error('Error getting IP:', error);
      }

      await db.createClickEvent({
        link_id: link.id,
        referrer: referrer || undefined,
        user_agent: userAgent || undefined,
        ip_hash: ipHash || undefined,
        source: source || undefined,
      });

      window.location.href = link.original_url;
    } catch (error: any) {
      console.error('Redirect error:', error);
      setNotFound(true);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 overflow-x-hidden">
        <div className="text-center max-w-md overflow-x-hidden">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-300 mb-4">Link not found</h2>
          <p className="text-gray-400 mb-8">
            This link doesn't exist or has been deactivated.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to TubeLinkr
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center overflow-x-hidden">
      <div className="text-gray-400">Redirecting...</div>
    </div>
  );
}
