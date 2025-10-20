import pool from '../db.js';

function getAnnouncementForRole(role) {
	// Simple, extendable role-based messages
	switch ((role || '').toLowerCase()) {
		case 'admin':
			return 'You have administrator access. Visit the admin dashboard to manage the system.';
		case 'moderator':
			return 'You can review and moderate user content.';
		case 'user':
			return 'Welcome! Check your dashboard for updates and messages.';
		default:
			return 'Welcome! Visit your dashboard to get started.';
	}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed for login.'
    });
  }

  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const announcement = getAnnouncementForRole(user.role);

      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.username || username}!`,
        announcement,
        role: user.role,
        issuedAt: new Date().toISOString()
      });
    } else {
      // Keep response generic to avoid account enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An internal server error occurred. Please try again later.'
    });
  }
}
