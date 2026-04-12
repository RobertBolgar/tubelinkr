export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    
    if (!userId) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    try {
      const { results } = await env.DB.prepare(
        `SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active, placement_count 
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
        data: { id: result.meta.last_row_id, user_id, slug, original_url, title, is_active: 1, placement_count: 0 }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error creating link:', error);
      
      // Check for unique constraint violation (duplicate slug)
      if (error.message && error.message.includes('UNIQUE constraint failed: links.user_id, links.slug')) {
        return new Response(JSON.stringify({ 
          error: 'This link slug is already in use. Please choose a different slug.' 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'PUT') {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      const { original_url, title, slug, is_active } = await request.json();
      const now = new Date().toISOString();
      
      console.log('Updating link:', { id, original_url, title, slug, is_active });
      
      // Build dynamic update query
      const updates = [];
      const params = [];
      
      if (original_url !== undefined) {
        updates.push('original_url = ?');
        params.push(original_url);
      }
      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title || null);
      }
      if (slug !== undefined) {
        updates.push('slug = ?');
        params.push(slug);
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(is_active);
      }
      
      updates.push('updated_at = ?');
      params.push(now);
      
      if (updates.length === 1) {
        return new Response(JSON.stringify({ error: 'No fields to update' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      params.push(id);
      
      const result = await env.DB.prepare(
        `UPDATE links SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...params).run();
      
      if (result.meta.changes === 0) {
        return new Response(JSON.stringify({ error: 'Link not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Link updated successfully'
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error updating link:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response('Method not allowed', { status: 405 });
}
