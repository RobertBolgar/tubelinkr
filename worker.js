// Cloudflare Worker API for TubeLinkr
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        },
      });
    }

    // Parse the URL path
    const path = url.pathname;
    
    // API routes
    if (path.startsWith('/api/users')) {
      return handleUsersAPI(request, env);
    }
    
    if (path.startsWith('/api/links')) {
      return handleLinksAPI(request, env);
    }
    
    if (path.startsWith('/api/click-events')) {
      return handleClickEventsAPI(request, env);
    }

    // Default response
    return new Response(JSON.stringify({ 
      message: 'TubeLinkr API is working',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }
};

// Users API handlers
async function handleUsersAPI(request, env) {
  const url = new URL(request.url);
  
  if (request.method === 'POST' && path === '/api/users') {
    // Create user
    const userData = await request.json();
    
    // For now, just store in D1
    const sql = `
      INSERT INTO users (email, username, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [userData.email, userData.username, new Date().toISOString(), new Date().toISOString(), true];
    
    const result = await env.DB.prepare(sql).bind(...params).run();
    
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }
  
  if (request.method === 'GET' && path.startsWith('/api/users/')) {
    // Get user by username
    const username = path.split('/api/users/')[1];
    
    const sql = `
      SELECT id, email, username, created_at, updated_at, is_active
      FROM users 
      WHERE username = ? AND is_active = ?
    `;
    const params = [username, true];
    
    const result = await env.DB.prepare(sql).bind(...params).first();
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }
}

// Links API handlers
async function handleLinksAPI(request, env) {
  const url = new URL(request.url);
  
  if (request.method === 'POST' && path === '/api/links') {
    // Create link
    const linkData = await request.json();
    
    const sql = `
      INSERT INTO links (user_id, slug, original_url, title, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      linkData.user_id,
      linkData.slug,
      linkData.original_url,
      linkData.title || null,
      new Date().toISOString(),
      new Date().toISOString(),
      true
    ];
    
    const result = await env.DB.prepare(sql).bind(...params).run();
    
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }
  
  if (request.method === 'GET' && path.startsWith('/api/links?')) {
    // Get links by user ID
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('user_id');
    
    const sql = `
      SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active
      FROM links 
      WHERE user_id = ? AND is_active = ?
      ORDER BY created_at DESC
    `;
    const params = [userId, true];
    
    const result = await env.DB.prepare(sql).bind(...params).all();
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }
  
  if (request.method === 'GET' && path.match(/^\/api\/links\/([^\/]+)$/)) {
    // Get link by ID
    const linkId = path.match(/^\/api\/links\/([^\/]+)$/)[1];
    
    const sql = `
      SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active
      FROM links 
      WHERE id = ? AND is_active = ?
    `;
    const params = [linkId, true];
    
    const result = await env.DB.prepare(sql).bind(...params).first();
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }
  
  if (request.method === 'PUT' && path.match(/^\/api\/links\/([^\/]+)$/)) {
    // Update link
    const linkId = path.match(/^\/api\/links\/([^\/]+)$/)[1];
    const updateData = await request.json();
    
    const setClause = Object.keys(updateData).filter(key => key !== 'id').map(key => `${key} = ?`).join(', ');
    const sql = `
      UPDATE links 
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `;
    const params = [...Object.values(updateData), new Date().toISOString(), linkId];
    
    const result = await env.DB.prepare(sql).bind(...params).run();
    
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }
  
  if (request.method === 'DELETE' && path.match(/^\/api\/links\/([^\/]+)$/)) {
    // Delete link
    const linkId = path.match(/^\/api\/links\/([^\/]+)$/)[1];
    
    const sql = `
      UPDATE links 
      SET is_active = ?, updated_at = ?
      WHERE id = ?
    `;
    const params = [false, new Date().toISOString(), linkId];
    
    const result = await env.DB.prepare(sql).bind(...params).run();
    
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }
  
  if (request.method === 'GET' && path.match(/^\/api\/links\/([^\/]+)\/([^\/]+)$/)) {
    // Get link by user and slug
    const matches = path.match(/^\/api\/links\/([^\/]+)\/([^\/]+)$/);
    const userId = matches[1];
    const slug = matches[2];
    
    const sql = `
      SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active
      FROM links 
      WHERE user_id = ? AND slug = ? AND is_active = ?
    `;
    const params = [userId, slug, true];
    
    const result = await env.DB.prepare(sql).bind(...params).first();
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }
  
  return new Response('Not found', { status: 404 });
}

// Click Events API handlers
async function handleClickEventsAPI(request, env) {
  const url = new URL(request.url);
  
  if (request.method === 'POST' && path === '/api/click-events') {
    // Create click event
    const eventData = await request.json();
    
    const sql = `
      INSERT INTO click_events (link_id, timestamp, referrer, user_agent, ip_hash, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      eventData.link_id,
      new Date().toISOString(),
      eventData.referrer || null,
      eventData.user_agent || null,
      eventData.ip_hash || null,
      eventData.source || null
    ];
    
    const result = await env.DB.prepare(sql).bind(...params).run();
    
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  if (request.method === 'POST' && path === '/api/click-events') {
    // Get click events by link IDs
    const { link_ids } = await request.json();
    
    const placeholders = link_ids.map(() => '?').join(',');
    const sql = `
      SELECT id, link_id, referrer, user_agent, ip_hash, source, timestamp
      FROM click_events 
      WHERE link_id IN (${placeholders})
      ORDER BY timestamp DESC
    `;
    const params = [];
    
    const result = await env.DB.prepare(sql).bind(...params).all();
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  return new Response('Not found', { status: 404 });
}
