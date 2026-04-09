export async function onRequest() {
  try {
    const result = await env.DB.prepare('SELECT COUNT(*) as count FROM links').first();
    return new Response(JSON.stringify({ 
      message: 'Database test',
      links_count: result.count,
      db_available: true
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      db_available: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
