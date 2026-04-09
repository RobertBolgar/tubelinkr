export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/api/users/');
    const username = pathParts.length > 1 ? pathParts[1] : null;
    
    if (!username) {
      return new Response(JSON.stringify({ error: 'username required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    try {
      const user = await env.DB.prepare(
        `SELECT id, email, username, created_at, updated_at, is_active 
         FROM users WHERE username = ? AND is_active = 1`
      ).bind(username).first();
      
      return new Response(JSON.stringify(user || null), {
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
      const { email, username } = await request.json();
      const now = new Date().toISOString();
      
      console.log('Creating user:', { email, username });
      
      const result = await env.DB.prepare(
        `INSERT INTO users (email, username, created_at, updated_at, is_active) 
         VALUES (?, ?, ?, ?, ?)`
      ).bind(email, username, now, now, 1).run();
      
      console.log('User created successfully:', result.meta.last_row_id);
      
      return new Response(JSON.stringify({
        success: true,
        data: { id: result.meta.last_row_id, email, username }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response('Method not allowed', { status: 405 });
}
