const express  = require('express');
const router   = express.Router();
const Question = require('../models/Question');

// GET /api/questions
// GET /api/questions?since=ISO_DATE&difficulty=easy&cat=Copa 2026
router.get('/', async (req, res) => {
  try {
    const { since, difficulty, cat } = req.query;
    const filter = { active: true };

    if (since) {
      const d = new Date(since);
      if (!isNaN(d)) filter.updatedAt = { $gt: d };
    }
    if (difficulty) filter.difficulty = difficulty;
    if (cat)        filter.cat        = cat;

    const questions = await Question.find(filter)
      .select('-__v')
      .sort({ updatedAt: 1 })
      .limit(5000)
      .lean();

    res.json({
      success:  true,
      count:    questions.length,
      syncedAt: new Date().toISOString(),
      questions,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/questions/random?count=10&difficulty=medium
router.get('/random', async (req, res) => {
  try {
    const count  = Math.min(parseInt(req.query.count) || 10, 50);
    const filter = { active: true };
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.cat)        filter.cat        = req.query.cat;

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: count } },
      { $project: { __v: 0 } },
    ]);
    res.json({ success: true, count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/questions/categories
router.get('/categories', async (req, res) => {
  try {
    const cats = await Question.distinct('cat', { active: true });
    res.json({ success: true, count: cats.length, categories: cats.sort() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/questions
router.post('/', async (req, res) => {
  try {
    const q = await Question.create(req.body);
    res.status(201).json({ success: true, question: q });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/questions/:id
router.put('/:id', async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!q) return res.status(404).json({ success: false, error: 'Question not found' });
    res.json({ success: true, question: q });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/questions/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!q) return res.status(404).json({ success: false, error: 'Question not found' });
    res.json({ success: true, message: 'Question deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
