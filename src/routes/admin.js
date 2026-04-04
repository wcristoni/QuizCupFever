const express  = require('express');
const router   = express.Router();
const Question = require('../models/Question');
const Player   = require('../models/Player');

function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// GET /admin/stats (público — usado pelo hub)
router.get('/stats', async (req, res) => {
  try {
    const [total, players, cats, byDiff] = await Promise.all([
      Question.countDocuments({ active: true }),
      Player.countDocuments(),
      Question.distinct('cat', { active: true }),
      Question.aggregate([
        { $match: { active: true } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } }
      ]),
    ]);
    res.json({
      success: true,
      stats: {
        total, players,
        categories: cats.length,
        byDifficulty: byDiff,
        byCategory: cats,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const sort  = req.query.sort || 'rankScore';
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const validSorts = { rankScore: -1, bestScore: -1, totalGames: -1, lastSeen: -1 };
    const sortField   = validSorts[sort] !== undefined ? sort : 'rankScore';

    const players = await Player.find()
      .select('-recentSessions -__v')
      .sort({ [sortField]: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, count: players.length, users: players });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /admin/users/:id
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await Player.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /admin/export
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { format = 'full', cat, difficulty } = req.query;
    const filter = { active: true };
    if (cat)        filter.cat        = cat;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await Question.find(filter)
      .select('-__v -active').sort({ cat: 1 }).lean();

    const data = format === 'compact'
      ? questions.map(q => ({ q: q.q, o: q.o, c: q.c, cat: q.cat }))
      : questions;

    res.setHeader('Content-Disposition', `attachment; filename="cupfever-questions-${Date.now()}.json"`);
    res.json({ success: true, count: data.length, exportedAt: new Date().toISOString(), questions: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /admin/bulk
router.post('/bulk', requireAdmin, async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ success: false, error: 'questions array required' });
    }
    const result = await Question.insertMany(questions, { ordered: false });
    res.status(201).json({ success: true, inserted: result.length });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
