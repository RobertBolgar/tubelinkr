export async function onRequest(context) {
  const { env } = context;
  
  try {
    // Add source column to click_events table
    const result = await env.DB.prepare(
      `ALTER TABLE click_events ADD COLUMN source TEXT`
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Source column added to click_events table',
      result
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
