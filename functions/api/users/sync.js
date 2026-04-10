export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { clerk_user_id, email } = await request.json();
    const now = new Date().toISOString();
    
    console.log('Syncing Clerk user:', { clerk_user_id, email });
    
    // Check if user already exists by clerk_user_id
    let user = await env.DB.prepare(
      'SELECT id, email, username, clerk_user_id, created_at, updated_at, is_active FROM users WHERE clerk_user_id = ?'
    ).bind(clerk_user_id).first();
    
    if (user) {
      // Update existing user
      await env.DB.prepare(
        'UPDATE users SET email = ?, updated_at = ? WHERE clerk_user_id = ?'
      ).bind(email, now, clerk_user_id).run();
      
      console.log('Updated existing user:', user.id);
      
      return new Response(JSON.stringify({
        success: true,
        data: user
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if user exists by email
    user = await env.DB.prepare(
      'SELECT id, email, username, clerk_user_id FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first();
    
    if (user) {
      // Update existing user with clerk_user_id
      await env.DB.prepare(
        'UPDATE users SET clerk_user_id = ?, updated_at = ? WHERE id = ?'
      ).bind(clerk_user_id, now, user.id).run();
      
      user.clerk_user_id = clerk_user_id;
      user.updated_at = now;
      
      console.log('Updated user with clerk_user_id:', user.id);
      
      return new Response(JSON.stringify({
        success: true,
        data: user
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Create new user without username (will be set in setup-username)
    const result = await env.DB.prepare(
      `INSERT INTO users (email, username, clerk_user_id, created_at, updated_at, is_active) 
       VALUES (?, NULL, ?, ?, ?, ?)`
    ).bind(email, clerk_user_id, now, now, 1).run();
    
    const newUser = {
      id: result.meta.last_row_id,
      email,
      username: null,
      clerk_user_id,
      created_at: now,
      updated_at: now,
      is_active: 1
    };
    
    console.log('Created new user:', newUser.id);
    
    return new Response(JSON.stringify({
      success: true,
      data: newUser
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error syncing Clerk user:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({ error: 'Use POST method for sync' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
