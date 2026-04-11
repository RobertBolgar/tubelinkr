export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, clerk_user_id } = await request.json();
    const now = new Date().toISOString();
    
    console.log('Confirming username for user:', { clerk_user_id, username });
    
    // Validate username
    if (!username || username.trim() === '') {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const trimmedUsername = username.trim().toLowerCase();
    
    // Check allowed characters
    if (!/^[a-z0-9_-]+$/.test(trimmedUsername)) {
      return new Response(JSON.stringify({ error: 'Username can only contain letters, numbers, underscores, and hyphens' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check length
    if (trimmedUsername.length < 3) {
      return new Response(JSON.stringify({ error: 'Username must be at least 3 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (trimmedUsername.length > 30) {
      return new Response(JSON.stringify({ error: 'Username must be less than 30 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if user exists
    const user = await env.DB.prepare(
      'SELECT id, username FROM users WHERE clerk_user_id = ? AND is_active = 1'
    ).bind(clerk_user_id).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if username is already taken by another user
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ? AND id != ? AND is_active = 1'
    ).bind(trimmedUsername, user.id).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username is already taken' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Update username and mark as confirmed by user
    await env.DB.prepare(
      'UPDATE users SET username = ?, username_confirmed_by_user = 1, updated_at = ? WHERE id = ?'
    ).bind(trimmedUsername, now, user.id).run();
    
    // Fetch updated user
    const updatedUser = await env.DB.prepare(
      'SELECT id, email, username, clerk_user_id, created_at, updated_at, is_active, username_confirmed_by_user FROM users WHERE id = ?'
    ).bind(user.id).first();
    
    console.log('Username confirmed for user:', user.id, trimmedUsername);
    
    return new Response(JSON.stringify({
      success: true,
      data: updatedUser
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error confirming username:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({ error: 'Use POST method for onboarding' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
