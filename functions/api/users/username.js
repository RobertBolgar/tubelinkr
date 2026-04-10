export async function onRequestPut(context) {
  const { request, env } = context;
  
  try {
    const { username, clerk_user_id } = await request.json();
    const now = new Date().toISOString();
    
    console.log('Updating username:', { clerk_user_id, username });
    
    // Validate username
    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (username.length < 3 || username.length > 30) {
      return new Response(JSON.stringify({ error: 'Username must be 3-30 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return new Response(JSON.stringify({ error: 'Username can only contain letters, numbers, underscores, and hyphens' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get user by clerk_user_id
    const user = await env.DB.prepare(
      'SELECT id, username FROM users WHERE clerk_user_id = ? AND is_active = 1'
    ).bind(clerk_user_id).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if new username is already taken by another user
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ? AND id != ? AND is_active = 1'
    ).bind(username, user.id).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username is already taken' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Update username
    await env.DB.prepare(
      'UPDATE users SET username = ?, updated_at = ? WHERE id = ?'
    ).bind(username, now, user.id).run();
    
    console.log('Username updated successfully:', user.id, username);
    
    // Return updated user data
    const updatedUser = await env.DB.prepare(
      'SELECT id, email, username, clerk_user_id, created_at, updated_at, is_active FROM users WHERE id = ?'
    ).bind(user.id).first();
    
    return new Response(JSON.stringify({
      success: true,
      data: updatedUser
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating username:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({ error: 'Use PUT method to update username' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
