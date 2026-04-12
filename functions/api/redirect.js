export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  
  // Expected formats:
  // - /api/redirect/{userId}/{slug} (base link)
  // - /api/redirect/{userId}/{slug}/{trackingCode} (placement link)
  if (pathParts.length < 4) {
    return new Response('Invalid redirect URL', { status: 400 });
  }
  
  const userId = pathParts[3];
  const slug = pathParts[4];
  const trackingCode = pathParts[5] || null; // Optional path-based tracking code
  
  try {
    console.log('Redirect request:', { userId, slug, trackingCode });
    
    // Find the link
    const link = await env.DB.prepare(
      'SELECT id, original_url FROM links WHERE user_id = ? AND slug = ? AND is_active = 1'
    ).bind(userId, slug).first();
    
    console.log('Found link:', link);
    
    if (!link) {
      return new Response('Link not found', { status: 404 });
    }
    
    // Get source from query parameter (backward compatibility) or path-based tracking code
    let source = url.searchParams.get('source');
    if (trackingCode) {
      // Use path-based tracking code as source
      source = trackingCode;
    }
    const normalizedSource = source ? source.toLowerCase().trim() : 'direct';
    
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
    return new Response('Internal server error: ' + error.message, { status: 500 });
  }
}
