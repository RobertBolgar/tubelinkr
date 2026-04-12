export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      console.log('POST click events request:', body);
      
      // Handle analytics retrieval (link_ids array)
      if (body.link_ids && Array.isArray(body.link_ids)) {
        console.log('Retrieving analytics for link_ids:', body.link_ids);
        
        const link_ids = body.link_ids.map(id => String(id));
        
        if (link_ids.length === 0) {
          return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        const placeholders = link_ids.map(() => '?').join(',');
        const { results } = await env.DB.prepare(
          `SELECT id, link_id, referrer, user_agent, ip_hash, source, timestamp 
           FROM click_events WHERE link_id IN (${placeholders}) ORDER BY timestamp DESC`
        ).bind(...link_ids).all();
        
        console.log('Found click events:', results ? results.length : 0);
        
        // Add source-based analytics
        const sourceAnalytics = {};
        let totalClicks = 0;
        
        if (results && results.length > 0) {
          // Group by source
          results.forEach(event => {
            const source = event.source || null;
            sourceAnalytics[source] = (sourceAnalytics[source] || 0) + 1;
            totalClicks++;
          });
          
          // Convert to array and sort by clicks descending
          const bySource = Object.entries(sourceAnalytics)
            .map(([source, clicks]) => ({ source, clicks }))
            .sort((a, b) => b.clicks - a.clicks);
          
          // Add source analytics to response
          const response = {
            events: results,
            totalClicks,
            bySource
          };
          
          return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          // Return empty response if no results
          return new Response(JSON.stringify({
            events: [],
            totalClicks: 0,
            bySource: []
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Handle click recording (link_id)
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
      ).bind(link_id, now, referrer || null, user_agent || null, ip_hash || null, source || 'direct').run();
      
      console.log('Click event recorded:', { link_id, result });
      
      return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('POST click events error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'GET') {
    return new Response('Method not allowed. Use POST for analytics.', { status: 405 });
  }
  
  return new Response('Method not allowed', { status: 405 });
}
