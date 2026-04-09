/**
 * Cloudflare Worker for public branded links
 * Handles go.tubelinkr.com/{username}/{slug}?source={code}
 * 
 * This Worker:
 * 1. Parses username and slug from the URL
 * 2. Looks up user by username to get userId
 * 3. Redirects internally to /api/redirect/{userId}/{slug}?source={code}
 * 4. Preserves all existing analytics and tracking logic
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
    
    // Expected format: /{username}/{slug}
    if (pathParts.length < 2) {
      return new Response('Not found', { status: 404 });
    }
    
    const username = pathParts[0];
    const slug = pathParts[1];
    
    console.log('Public redirect request:', { username, slug });
    
    try {
      // Look up user by username
      const userResponse = await fetch(`${url.origin}/api/users/${username}`);
      
      if (!userResponse.ok) {
        console.log('User not found:', username);
        return new Response('User not found', { status: 404 });
      }
      
      const user = await userResponse.json();
      
      if (!user || !user.id) {
        console.log('Invalid user response');
        return new Response('User not found', { status: 404 });
      }
      
      console.log('Found user:', user.id);
      
      // Build redirect URL to existing tracking endpoint
      const source = url.searchParams.get('source');
      const redirectUrl = new URL(`${url.origin}/api/redirect/${user.id}/${slug}`);
      
      if (source) {
        redirectUrl.searchParams.set('source', source);
      }
      
      console.log('Redirecting to tracking endpoint:', redirectUrl.toString());
      
      // Redirect to the existing tracking endpoint
      // This preserves all analytics logic
      return Response.redirect(redirectUrl.toString(), 307);
      
    } catch (error) {
      console.error('Public redirect error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
};
