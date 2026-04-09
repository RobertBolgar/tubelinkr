export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Only handle clean URL redirects: /username/slug
  // Skip API routes, static assets, and root
  if (path.startsWith('/api/') || path.startsWith('/assets/') || path === '/') {
    // Return undefined to let static site handle these
    return;
  }
  
  const pathParts = path.split('/').filter(part => part.length > 0);
  
  // Must have exactly 2 parts: username and slug
  if (pathParts.length !== 2) {
    return;
  }
  
  const [username, slug] = pathParts;
  
  try {
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
    
    // Record click event
    const now = new Date().toISOString();
    const referrer = request.headers.get('referer') || null;
    const userAgent = request.headers.get('user-agent') || null;
    const ipHash = request.headers.get('cf-connecting-ip') || null;
    
    await env.DB.prepare(
      `INSERT INTO click_events (link_id, timestamp, referrer, user_agent, ip_hash, source) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(link.id, now, referrer, userAgent, ipHash, 'clean-url').run();
    
    // Redirect to original URL
    return Response.redirect(link.original_url, 302);
    
  } catch (error) {
    console.error('Redirect error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
