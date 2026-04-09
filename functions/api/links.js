export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    try {
      const { results } = await env.DB.prepare(
        `SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active 
         FROM links WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC`
      ).bind(userId).all();
      
      return new Response(JSON.stringify(results || []), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'POST') {
    try {
      const { user_id, slug, original_url, title } = await request.json();
      const now = new Date().toISOString();
      
      console.log('Creating link:', { user_id, slug, original_url, title });
      
      // Verify user exists
      const user = await env.DB.prepare(
        'SELECT id FROM users WHERE id = ? OR username = ? AND is_active = 1'
      ).bind(user_id, user_id).first();
      
      if (!user) {
        return new Response(JSON.stringify({ 
          error: 'User not found. Please sign up first.' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const result = await env.DB.prepare(
        `INSERT INTO links (user_id, slug, original_url, title, created_at, updated_at, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(user_id, slug, original_url, title || null, now, now, 1).run();
      
      return new Response(JSON.stringify({
        success: true,
        data: { id: result.meta.last_row_id, user_id, slug, original_url, title, is_active: 1 }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error creating link:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response('Method not allowed', { status: 405 });
}
