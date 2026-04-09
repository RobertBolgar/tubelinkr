export async function onRequest(context) {
  try {
    // Create users table
    await context.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1
      )
    `).run();
    
    // Create links table
    await context.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        slug TEXT NOT NULL,
        original_url TEXT NOT NULL,
        title TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `).run();
    
    // Create click_events table
    await context.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS click_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        link_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        referrer TEXT,
        user_agent TEXT,
        ip_hash TEXT,
        source TEXT,
        FOREIGN KEY (link_id) REFERENCES links (id)
      )
    `).run();
    
    // Create a test user
    const now = new Date().toISOString();
    const userResult = await context.env.DB.prepare(`
      INSERT OR IGNORE INTO users (email, username, created_at, updated_at, is_active) 
      VALUES (?, ?, ?, ?, ?)
    `).bind('test@example.com', 'testuser', now, now, 1).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database initialized with test user',
      test_user_id: userResult.meta.last_row_id || 'existing'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      message: 'Database initialization failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
