export async function onRequest(context) {
  const { request, env, params } = context;
  const linkId = params.id;

  if (request.method === 'GET') {
    try {
      const link = await env.DB.prepare(
        `SELECT l.*, u.username 
         FROM links l 
         JOIN users u ON l.user_id = u.id 
         WHERE l.id = ?`
      ).bind(linkId).first();

      if (!link) {
        return new Response(JSON.stringify({ error: 'Link not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(link), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching link:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (request.method === 'PUT') {
    try {
      const { original_url, title, slug, is_active } = await request.json();
      const now = new Date().toISOString();
      
      console.log('Updating link via [id].js:', { linkId, original_url, title, slug, is_active });
      
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
      
      params.push(linkId);
      
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
