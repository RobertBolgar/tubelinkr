/**
 * Cloudflare Worker for public branded links
 * Handles go.tubelinkr.com/{username}/{slug}?source={code}
 * 
 * This Worker:
 * 1. Parses username and slug from the URL
 * 2. Looks up user by username to get userId
 * 3. Redirects internally to /api/redirect/{userId}/{slug}?source={code}
 * 4. Preserves all existing analytics and tracking logic
 * 
 * IMPORTANT: Replace MAIN_APP_ORIGIN with your main application domain
 * (e.g., https://tubelinkr.pages.dev or your custom domain)
 */

const MAIN_APP_ORIGIN = 'https://tubelinkrgit.pages.dev'; // TODO: Replace with your actual main app domain

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
    
    console.log('=== Public Redirect Request ===');
    console.log('Requested username:', username);
    console.log('Requested slug:', slug);
    console.log('Using MAIN_APP_ORIGIN:', MAIN_APP_ORIGIN);
    
    try {
      // Look up user by username - call main app's API
      const userLookupUrl = `${MAIN_APP_ORIGIN}/api/users/${username}`;
      console.log('User lookup URL:', userLookupUrl);
      
      const userResponse = await fetch(userLookupUrl);
      
      if (!userResponse.ok) {
        console.log('User not found:', username, 'Status:', userResponse.status);
        return new Response('User not found', { status: 404 });
      }
      
      const user = await userResponse.json();
      
      if (!user || !user.id) {
        console.log('Invalid user response:', user);
        return new Response('User not found', { status: 404 });
      }
      
      console.log('Resolved user ID:', user.id);
      
      // Build redirect URL to existing tracking endpoint on main app
      const source = url.searchParams.get('source');
      const redirectUrl = new URL(`${MAIN_APP_ORIGIN}/api/redirect/${user.id}/${slug}`);
      
      if (source) {
        redirectUrl.searchParams.set('source', source);
        console.log('Source parameter:', source);
      }
      
      console.log('Final redirect URL:', redirectUrl.toString());
      console.log('=== End Request ===');
      
      // Redirect to the existing tracking endpoint
      // This preserves all analytics logic
      return Response.redirect(redirectUrl.toString(), 307);
      
    } catch (error) {
      console.error('Public redirect error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
};
