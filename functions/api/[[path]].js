// Cloudflare Pages Function - API route handler
// Reuses the worker.js logic for handling API requests

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Route to appropriate handler
    if (path.startsWith('/api/users')) {
      return handleUsersAPI(request, env, corsHeaders);
    }

    if (path.startsWith('/api/links')) {
      return handleLinksAPI(request, env, corsHeaders);
    }

    if (path.startsWith('/api/click-events')) {
      return handleClickEventsAPI(request, env, corsHeaders);
    }

    return new Response(JSON.stringify({ message: 'API is working' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleUsersAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'POST' && path === '/api/users') {
    const { email, username } = await request.json();
    const now = new Date().toISOString();
    
    const result = await env.DB.prepare(
      `INSERT INTO users (email, username, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?)`
    ).bind(email, username, now, now, 1).run();
    
    return new Response(JSON.stringify({
      success: true,
      data: { id: result.meta.last_row_id, email, username }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'GET') {
    const username = path.split('/api/users/')[1];
    if (username) {
      const user = await env.DB.prepare(
        `SELECT id, email, username, created_at, updated_at, is_active FROM users WHERE username = ? AND is_active = 1`
      ).bind(username).first();
      
      return new Response(JSON.stringify(user || null), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Not found', { status: 404, headers: corsHeaders });
}

async function handleLinksAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'GET' && path === '/api/links') {
    const userId = url.searchParams.get('user_id');
    const { results } = await env.DB.prepare(
      `SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active 
       FROM links WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC`
    ).bind(userId).all();
    
    return new Response(JSON.stringify(results || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'POST' && path === '/api/links') {
    const { user_id, slug, original_url, title } = await request.json();
    const now = new Date().toISOString();
    
    const result = await env.DB.prepare(
      `INSERT INTO links (user_id, slug, original_url, title, created_at, updated_at, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(user_id, slug, original_url, title || null, now, now, 1).run();
    
    return new Response(JSON.stringify({
      success: true,
      data: { id: result.meta.last_row_id, user_id, slug, original_url, title, is_active: 1 }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'GET' && path.match(/^\/api\/links\/([^\/]+)$/)) {
    const linkId = path.match(/^\/api\/links\/([^\/]+)$/)[1];
    const link = await env.DB.prepare(
      `SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active 
       FROM links WHERE id = ? AND is_active = 1`
    ).bind(linkId).first();
    
    return new Response(JSON.stringify(link || null), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'PUT' && path.match(/^\/api\/links\/([^\/]+)$/)) {
    const linkId = path.match(/^\/api\/links\/([^\/]+)$/)[1];
    const updates = await request.json();
    const now = new Date().toISOString();
    
    const fields = [];
    const values = [];
    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.slug !== undefined) { fields.push('slug = ?'); values.push(updates.slug); }
    if (updates.original_url !== undefined) { fields.push('original_url = ?'); values.push(updates.original_url); }
    if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active ? 1 : 0); }
    fields.push('updated_at = ?'); values.push(now);
    values.push(linkId);
    
    if (fields.length > 1) {
      await env.DB.prepare(`UPDATE links SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'DELETE' && path.match(/^\/api\/links\/([^\/]+)$/)) {
    const linkId = path.match(/^\/api\/links\/([^\/]+)$/)[1];
    const now = new Date().toISOString();
    
    await env.DB.prepare(`UPDATE links SET is_active = 0, updated_at = ? WHERE id = ?`).bind(now, linkId).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'GET' && path.match(/^\/api\/links\/([^\/]+)\/([^\/]+)$/)) {
    const matches = path.match(/^\/api\/links\/([^\/]+)\/([^\/]+)$/);
    const userId = matches[1];
    const slug = matches[2];
    
    const link = await env.DB.prepare(
      `SELECT id, user_id, slug, original_url, title, created_at, updated_at, is_active 
       FROM links WHERE user_id = ? AND slug = ? AND is_active = 1`
    ).bind(userId, slug).first();
    
    return new Response(JSON.stringify(link || null), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Not found', { status: 404, headers: corsHeaders });
}

async function handleClickEventsAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'POST') {
    if (path === '/api/click-events') {
      const { link_id, referrer, user_agent, ip_hash, source } = await request.json();
      const now = new Date().toISOString();
      
      await env.DB.prepare(
        `INSERT INTO click_events (link_id, timestamp, referrer, user_agent, ip_hash, source) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(link_id, now, referrer || null, user_agent || null, ip_hash || null, source || null).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get click events by link IDs
    const { link_ids } = await request.json();
    if (!link_ids || !Array.isArray(link_ids) || link_ids.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const placeholders = link_ids.map(() => '?').join(',');
    const { results } = await env.DB.prepare(
      `SELECT id, link_id, referrer, user_agent, ip_hash, source, timestamp 
       FROM click_events WHERE link_id IN (${placeholders}) ORDER BY timestamp DESC`
    ).bind(...link_ids).all();
    
    return new Response(JSON.stringify(results || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Not found', { status: 404, headers: corsHeaders });
}
