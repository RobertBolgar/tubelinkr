export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      console.log('Click event received:', body);
      
      const { link_id, referrer, user_agent, ip_hash, source } = body;
      const now = new Date().toISOString();
      
      if (!link_id) {
        console.error('Missing link_id in click event');
        return new Response(JSON.stringify({ error: 'link_id required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const result = await env.DB.prepare(
        `INSERT INTO click_events (link_id, timestamp, referrer, user_agent, ip_hash, source) 
           VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(link_id, now, referrer || null, user_agent || null, ip_hash || null, source || null).run();
      
      console.log('Click event recorded:', { link_id, result });
      
      return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Click event error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'GET') {
    try {
      const body = await request.json();
      console.log('GET click events request:', body);
      
      const { link_ids } = body;
      
      if (!link_ids || !Array.isArray(link_ids) || link_ids.length === 0) {
        console.log('No link_ids provided, returning empty array');
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Fetching click events for link_ids:', link_ids);
      
      const placeholders = link_ids.map(() => '?').join(',');
      const { results } = await env.DB.prepare(
        `SELECT id, link_id, referrer, user_agent, ip_hash, source, timestamp 
         FROM click_events WHERE link_id IN (${placeholders}) ORDER BY timestamp DESC`
      ).bind(...link_ids).all();
      
      console.log('Found click events:', results ? results.length : 0);
      
      return new Response(JSON.stringify(results || []), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('GET click events error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response('Method not allowed', { status: 405 });
}
