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
    
    // Generate a valid username from email
    const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
    let username = emailPrefix;
    
    // Check if username is already taken
    let existingUsername = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ? AND is_active = 1'
    ).bind(username).first();
    
    if (existingUsername) {
      // Append timestamp to ensure uniqueness
      const timestamp = Date.now().toString().slice(-6);
      username = `${emailPrefix}${timestamp}`;
      
      // Double check the new username
      existingUsername = await env.DB.prepare(
        'SELECT id FROM users WHERE username = ? AND is_active = 1'
      ).bind(username).first();
      
      if (existingUsername) {
        // If still taken, use random suffix
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        username = `${emailPrefix}${randomSuffix}`;
      }
    }
    
    // Create new user with generated username
    const result = await env.DB.prepare(
      `INSERT INTO users (email, username, clerk_user_id, created_at, updated_at, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(email, username, clerk_user_id, now, now, 1).run();
    
    const newUser = {
      id: result.meta.last_row_id,
      email,
      username,
      clerk_user_id,
      created_at: now,
      updated_at: now,
      is_active: 1
    };
    
    console.log('Created new user with username:', newUser.id, username);
    
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
