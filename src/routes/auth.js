const express = require('express');
const router  = express.Router();

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(
      payload.replace(/-/g,'+').replace(/_/g,'/'), 'base64'
    ).toString('utf8'));
  } catch { return null; }
}

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, error: 'credential required' });

    const payload = decodeJWT(credential);
    if (!payload?.email) return res.status(401).json({ success: false, error: 'Invalid credential' });

    res.json({
      success: true,
      user: {
        sub:       payload.sub,
        email:     payload.email,
        name:      Buffer.from(payload.name || '', 'utf8').toString('utf8'),
        firstName: Buffer.from(payload.given_name || '', 'utf8').toString('utf8'),
        picture:   payload.picture || '',
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me?email=...
router.get('/me', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, error: 'email required' });

    const Player = require('../models/Player');
    const player = await Player.findOne({ email: email.toLowerCase().trim() })
      .select('-recentSessions -__v').lean();

    res.json({ success: true, player: player || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
