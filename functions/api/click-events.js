export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'POST') {
    try {
      const { link_id, referrer, user_agent, ip_hash, source } = await request.json();
      const now = new Date().toISOString();
      
      await env.DB.prepare(
        `INSERT INTO click_events (link_id, timestamp, referrer, user_agent, ip_hash, source) 
           VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(link_id, now, referrer || null, user_agent || null, ip_hash || null, source || null).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'GET') {
    try {
      const { link_ids } = await request.json();
      
      if (!link_ids || !Array.isArray(link_ids) || link_ids.length === 0) {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const placeholders = link_ids.map(() => '?').join(',');
      const { results } = await env.DB.prepare(
        `SELECT id, link_id, referrer, user_agent, ip_hash, source, timestamp 
         FROM click_events WHERE link_id IN (${placeholders}) ORDER BY timestamp DESC`
      ).bind(...link_ids).all();
      
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
  
  return new Response('Method not allowed', { status: 405 });
}
