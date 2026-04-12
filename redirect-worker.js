/**
 * Cloudflare Worker for handling clean public redirect URLs
 * 
 * This Worker handles:
 * - /{username}/{slug} (base link)
 * - /{username}/{slug}/{public_code} (placement link)
 * 
 * Deployed to: go.tubelinkr.com
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    
    console.log('Path parts:', pathParts);
    
    // Expected formats:
    // - /{username}/{slug} (base link)
    // - /{username}/{slug}/{public_code} (placement link)
    if (pathParts.length < 3) {
      return new Response('Invalid redirect URL', { status: 400 });
    }
    
    const username = pathParts[1];
    const slug = pathParts[2];
    const public_code = pathParts[3] || null; // Optional path-based tracking code
    
    console.log('=== PARSED VALUES ===');
    console.log('Username:', username);
    console.log('Slug:', slug);
    console.log('Public code:', public_code);
    console.log('=====================');
    
    try {
      console.log('=== USER LOOKUP ===');
      console.log('Query: SELECT id FROM users WHERE username = ? AND is_active = 1');
      console.log('Parameter:', username);
      
      // First, find the user by username to get the numeric user_id
      const user = await env.DB.prepare(
        'SELECT id FROM users WHERE username = ? AND is_active = 1'
      ).bind(username).first();
      
      console.log('User lookup result:', user);
      console.log('User found:', !!user);
      if (user) {
        console.log('User ID:', user.id);
      }
      console.log('===================');
      
      if (!user) {
        console.log('ERROR: User not found');
        return new Response('User not found', { status: 404 });
      }
      
      console.log('=== LINK LOOKUP ===');
      console.log('Query: SELECT id, original_url FROM links WHERE user_id = ? AND slug = ? AND is_active = 1');
      console.log('Parameters:', user.id, slug);
      
      // Find the link by numeric user_id and slug
      const link = await env.DB.prepare(
        'SELECT id, original_url FROM links WHERE user_id = ? AND slug = ? AND is_active = 1'
      ).bind(user.id, slug).first();
      
      console.log('Link lookup result:', link);
      console.log('Link found:', !!link);
      if (link) {
        console.log('Link ID:', link.id);
        console.log('Link original_url:', link.original_url);
      }
      console.log('===================');
      
      if (!link) {
        console.log('ERROR: Link not found');
        return new Response('Link not found', { status: 404 });
      }
      
      // Get source from query parameter (backward compatibility) or path-based tracking code
      let source = url.searchParams.get('source');
      
      console.log('=== PLACEMENT LOOKUP ===');
      console.log('Query parameter source:', source);
      console.log('Public code from path:', public_code);
      
      if (public_code) {
        console.log('--- Lookup by public_code ---');
        console.log('Query: SELECT id, source_code, public_code FROM placements WHERE link_id = ? AND public_code = ?');
        console.log('Parameters:', link.id, public_code);
        
        // Check if public_code is a public_code (new format) or source_code (old format)
        const placement = await env.DB.prepare(
          'SELECT id, source_code, public_code FROM placements WHERE link_id = ? AND public_code = ?'
        ).bind(link.id, public_code).first();
        
        console.log('Placement lookup by public_code result:', placement);
        console.log('Placement found by public_code:', !!placement);
        
        if (placement) {
          // Use the source_code from the placement for tracking
          source = placement.source_code;
          console.log('SUCCESS: Found placement by public_code');
          console.log('Placement ID:', placement.id);
          console.log('Placement source_code:', source);
          console.log('Placement public_code:', placement.public_code);
        } else {
          // Try looking up by source_code for backward compatibility
          console.log('--- Fallback: Lookup by source_code ---');
          console.log('Query: SELECT id, source_code, public_code FROM placements WHERE link_id = ? AND source_code = ?');
          console.log('Parameters:', link.id, public_code);
          
          const placementBySourceCode = await env.DB.prepare(
            'SELECT id, source_code, public_code FROM placements WHERE link_id = ? AND source_code = ?'
          ).bind(link.id, public_code).first();
          
          console.log('Placement lookup by source_code result:', placementBySourceCode);
          console.log('Placement found by source_code:', !!placementBySourceCode);
          
          if (placementBySourceCode) {
            source = placementBySourceCode.source_code;
            console.log('SUCCESS: Found placement by source_code');
            console.log('Placement ID:', placementBySourceCode.id);
            console.log('Placement source_code:', source);
            console.log('Placement public_code:', placementBySourceCode.public_code);
          } else {
            // Fallback to using public_code as source_code (backward compatibility)
            source = public_code;
            console.log('WARNING: Placement not found by either public_code or source_code');
            console.log('Using public_code as source:', source);
          }
        }
      } else {
        console.log('No public_code in path, will use query parameter or direct');
      }
      
      const normalizedSource = source ? source.toLowerCase().trim() : 'direct';
      
      console.log('=== FINAL SOURCE ===');
      console.log('Original source:', source);
      console.log('Normalized source:', normalizedSource);
      console.log('=====================');
      
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
};
