export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Only handle clean URL redirects: /username/slug or /username/slug/source
  // Skip API routes, static assets, and root
  if (path.startsWith('/api/') || path.startsWith('/assets/') || path === '/') {
    // Return undefined to let static site handle these
    return;
  }
  
  const pathParts = path.split('/').filter(part => part.length > 0);
  
  // Must have exactly 2 or 3 parts: username and slug (optional source)
  if (pathParts.length < 2 || pathParts.length > 3) {
    return;
  }
  
  const [username, slug, source] = pathParts;
  
  try {
    console.log('Clean URL redirect request:', { username, slug, source });
    
    // Find user by username
    const user = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ? AND is_active = 1'
    ).bind(username).first();
    
    if (!user) {
      return new Response('User not found', { status: 404 });
    }
    
    // Find the link
    const link = await env.DB.prepare(
      'SELECT id, original_url FROM links WHERE user_id = ? AND slug = ? AND is_active = 1'
    ).bind(user.id, slug).first();
    
    if (!link) {
      return new Response('Link not found', { status: 404 });
    }
    
    // Normalize source (lowercase, trim)
    const normalizedSource = source ? source.toLowerCase().trim() : null;
    
    console.log('Found link:', { linkId: link.id, source: normalizedSource });
    
    // Record click event
    const now = new Date().toISOString();
    const referrer = request.headers.get('referer') || null;
    const userAgent = request.headers.get('user-agent') || null;
    const ipHash = request.headers.get('cf-connecting-ip') || null;
    
    try {
      await env.DB.prepare(
        `INSERT INTO click_events (link_id, timestamp, referrer, user_agent, ip_hash, source) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(link.id, now, referrer, userAgent, ipHash, normalizedSource).run();
      console.log('Click event recorded:', { linkId: link.id, source: normalizedSource });
    } catch (clickError) {
      console.error('Failed to record click:', clickError);
      // Continue with redirect even if click recording fails
    }
    
    // Redirect to original URL
    console.log('Redirecting to:', link.original_url);
    return Response.redirect(link.original_url, 302);
    
  } catch (error) {
    console.error('Redirect error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
