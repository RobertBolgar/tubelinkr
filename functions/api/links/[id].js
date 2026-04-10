export async function onRequest(context) {
  const { request, env, params } = context;
  const linkId = params.id;

  if (request.method === 'GET') {
    try {
      const link = await env.DB.prepare(
        `SELECT l.*, u.username 
         FROM links l 
         JOIN users u ON l.user_id = u.id 
         WHERE l.id = ?`
      ).bind(linkId).first();

      if (!link) {
        return new Response(JSON.stringify({ error: 'Link not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(link), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching link:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
