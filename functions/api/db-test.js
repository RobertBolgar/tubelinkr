export async function onRequest(context) {
  try {
    // Test if env object exists and has DB binding
    console.log('Context object keys:', Object.keys(context));
    console.log('Env object keys:', context.env ? Object.keys(context.env) : 'no env');
    console.log('DB binding available:', !!context.env?.DB);
    
    if (!context.env || !context.env.DB) {
      return new Response(JSON.stringify({ 
        error: 'DB binding not available',
        context_keys: Object.keys(context),
        env_keys: context.env ? Object.keys(context.env) : 'no env'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Test database query
    const result = await context.env.DB.prepare('SELECT COUNT(*) as count FROM links').first();
    
    return new Response(JSON.stringify({ 
      message: 'Database binding test',
      links_count: result.count,
      db_available: true,
      context: 'success'
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
