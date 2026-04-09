export async function onRequest(context) {
  try {
    // Test simple INSERT without optional fields
    const result = await context.env.DB.prepare(
      'INSERT INTO links (user_id, slug, original_url, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind('test-user-id', 'test-slug', 'https://example.com', '2024-04-09T02:00:00.000Z', '2024-04-09T02:00:00.000Z', 1).run();
    
    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id,
      message: 'Test INSERT successful'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      message: 'Test INSERT failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
