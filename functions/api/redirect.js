export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  
  console.log('Path parts:', pathParts);
  
  // Expected formats for public URLs:
  // - /{userId}/{slug} (base link)
  // - /{userId}/{slug}/{publicCode} (placement link)
  if (pathParts.length < 3) {
    return new Response('Invalid redirect URL', { status: 400 });
  }
  
  const userId = pathParts[1];
  const slug = pathParts[2];
  const trackingCode = pathParts[3] || null; // Optional path-based tracking code
  
  console.log('Parsed values:', { userId, slug, trackingCode });
  
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
      console.log('Looking up placement by public_code:', trackingCode, 'for link_id:', link.id);
      // Check if trackingCode is a public_code (new format) or source_code (old format)
      const placement = await env.DB.prepare(
        'SELECT source_code FROM placements WHERE link_id = ? AND public_code = ?'
      ).bind(link.id, trackingCode).first();
      
      console.log('Placement lookup result:', placement);
      
      if (placement) {
        // Use the source_code from the placement for tracking
        source = placement.source_code;
        console.log('Found placement by public_code, using source_code:', source);
      } else {
        // Fallback to using trackingCode as source_code (backward compatibility)
        source = trackingCode;
        console.log('Placement not found by public_code, using trackingCode as source:', source);
      }
    }
    const normalizedSource = source ? source.toLowerCase().trim() : 'direct';
    
    console.log('Final source for click recording:', normalizedSource);
    
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
