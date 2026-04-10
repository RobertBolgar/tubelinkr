export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const linkId = url.searchParams.get('link_id');
    
    if (!linkId) {
      return new Response(JSON.stringify({ error: 'link_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    try {
      const result = await env.DB.prepare(
        `SELECT id, link_id, name, type, source_code, created_at, updated_at 
         FROM placements WHERE link_id = ? ORDER BY created_at DESC`
      ).bind(linkId).all();
      
      const placements = result.results || [];
      
      // Get click counts for each placement
      const placementsWithClicks = await Promise.all(
        placements.map(async (placement) => {
          const clickCount = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM click_events 
             WHERE link_id = ? AND source = ?`
          ).bind(linkId, placement.source_code).first();
          
          return {
            ...placement,
            clicks: clickCount?.count || 0
          };
        })
      );
      
      return new Response(JSON.stringify(placementsWithClicks), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching placements:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'POST') {
    try {
      const { link_id, name, type, source_code } = await request.json();
      const now = new Date().toISOString();
      
      if (!link_id || !name || !type || !source_code) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Validate type
      const validTypes = ['description', 'pinned', 'bio', 'short', 'video', 'other'];
      if (!validTypes.includes(type)) {
        return new Response(JSON.stringify({ error: 'Invalid type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Check if source_code is unique
      const existing = await env.DB.prepare(
        'SELECT id FROM placements WHERE source_code = ?'
      ).bind(source_code).first();
      
      if (existing) {
        return new Response(JSON.stringify({ error: 'Source code already in use' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Create placement
      const result = await env.DB.prepare(
        `INSERT INTO placements (link_id, name, type, source_code, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(link_id, name, type, source_code, now, now).run();
      
      // Update link placement_count
      await env.DB.prepare(
        `UPDATE links SET placement_count = placement_count + 1 WHERE id = ?`
      ).bind(link_id).run();
      
      const newPlacement = {
        id: result.meta.last_row_id,
        link_id,
        name,
        type,
        source_code,
        created_at: now,
        updated_at: now,
        clicks: 0
      };
      
      console.log('Created placement:', newPlacement);
      
      return new Response(JSON.stringify({
        success: true,
        data: newPlacement
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error creating placement:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'DELETE') {
    const url = new URL(request.url);
    const placementId = url.searchParams.get('id');
    
    if (!placementId) {
      return new Response(JSON.stringify({ error: 'id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    try {
      // Get placement info before deletion
      const placement = await env.DB.prepare(
        'SELECT link_id FROM placements WHERE id = ?'
      ).bind(placementId).first();
      
      if (!placement) {
        return new Response(JSON.stringify({ error: 'Placement not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Delete placement
      await env.DB.prepare(
        'DELETE FROM placements WHERE id = ?'
      ).bind(placementId).run();
      
      // Update link placement_count
      await env.DB.prepare(
        `UPDATE links SET placement_count = placement_count - 1 WHERE id = ?`
      ).bind(placement.link_id).run();
      
      console.log('Deleted placement:', placementId);
      
      return new Response(JSON.stringify({
        success: true
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error deleting placement:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response('Method not allowed', { status: 405 });
}
