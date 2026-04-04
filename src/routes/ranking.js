const express = require('express');
const router  = express.Router();
const Player  = require('../models/Player');

// GET /api/ranking?limit=50
router.get('/', async (req, res) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit) || 50, 100);
    const players = await Player.find().select('-recentSessions -__v').lean();

    if (!players.length) {
      return res.json({ success: true, updatedAt: new Date().toISOString(), count: 0, ranking: [] });
    }

    const now      = Date.now();
    const maxGames = Math.max(...players.map(p => p.totalGames || 0), 1);

    const ranked = players
      .map(p => {
        const wAcc = p.totalWeightedQuestions > 0
          ? p.totalWeightedCorrect / p.totalWeightedQuestions
          : p.totalQuestions > 0 ? p.totalCorrect / p.totalQuestions : 0;

        const vol     = Math.min((p.totalGames || 0) / maxGames, 1);
        const cutoff  = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const recent  = (p.recentSessions || []).filter(s => new Date(s.playedAt) >= cutoff).length;
        const freq    = Math.min(recent / 30, 1);
        const rankScore = Math.round((wAcc * 0.7 + vol * 0.2 + freq * 0.1) * 1000);

        const accuracy = p.totalQuestions > 0
          ? Math.round((p.totalCorrect / p.totalQuestions) * 100) : 0;

        return {
          name:        p.name,
          email:       p.email,
          rankScore,
          bestScore:   p.bestScore   || 0,
          totalGames:  p.totalGames  || 0,
          accuracy,
          recentGames: recent,
          maxStreak:   p.maxStreak   || 0,
          lastSeen:    p.lastSeen,
        };
      })
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, limit)
      .map((p, i) => ({ ...p, position: i + 1 }));

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      count: ranked.length,
      scoringModel: { weightedAccuracy: '70%', volume: '20%', frequency: '10%' },
      ranking: ranked,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ranking/sync
router.post('/sync', async (req, res) => {
  try {
    const {
      name, email, deviceId, score, correct, wrong, skipped,
      totalQuestions, maxStreak, weightedCorrect, weightedTotal
    } = req.body;

    if (!name || !deviceId) {
      return res.status(400).json({ success: false, error: 'name and deviceId are required' });
    }

    const cleanName = Buffer.from(name, 'utf8').toString('utf8').trim();

    const session = {
      score: score || 0, correct: correct || 0, wrong: wrong || 0,
      skipped: skipped || 0, totalQuestions: totalQuestions || 0,
      maxStreak: maxStreak || 0,
      weightedCorrect: weightedCorrect || correct || 0,
      weightedTotal:   weightedTotal   || totalQuestions || 0,
      playedAt: new Date(),
    };

    const query = email
      ? { $or: [{ email: email.toLowerCase().trim() }, { deviceId }] }
      : { deviceId };

    const player = await Player.findOneAndUpdate(query, {
      $set: {
        name: cleanName, deviceId, lastSeen: new Date(),
        ...(email ? { email: email.toLowerCase().trim() } : {}),
      },
      $inc: {
        totalGames:             1,
        totalCorrect:           correct         || 0,
        totalQuestions:         totalQuestions  || 0,
        totalWeightedCorrect:   weightedCorrect || correct || 0,
        totalWeightedQuestions: weightedTotal   || totalQuestions || 0,
      },
      $max: {
        bestScore: score     || 0,
        maxStreak: maxStreak || 0,
      },
      $push: { recentSessions: { $each: [session], $slice: -30 } },
    }, { upsert: true, new: true, setDefaultsOnInsert: true });

    // Recalcula rankScore
    const allPlayers = await Player.find({}, { totalGames: 1 }).lean();
    const maxGames   = Math.max(...allPlayers.map(p => p.totalGames || 0), 1);
    const cutoff     = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent     = (player.recentSessions || []).filter(s => new Date(s.playedAt) >= cutoff).length;

    const wAcc    = player.totalWeightedQuestions > 0
      ? player.totalWeightedCorrect / player.totalWeightedQuestions
      : player.totalQuestions > 0 ? player.totalCorrect / player.totalQuestions : 0;
    const vol     = Math.min((player.totalGames || 0) / maxGames, 1);
    const freq    = Math.min(recent / 30, 1);
    const rankScore = Math.round((wAcc * 0.7 + vol * 0.2 + freq * 0.1) * 1000);

    await Player.updateOne({ _id: player._id }, { $set: { rankScore } });

    const position = (await Player.countDocuments({ rankScore: { $gt: rankScore } })) + 1;
    const accuracy = player.totalQuestions
      ? Math.round((player.totalCorrect / player.totalQuestions) * 100) : 0;

    res.json({
      success: true,
      player: {
        name: player.name, email: player.email,
        rankScore, bestScore: player.bestScore || 0,
        totalGames: player.totalGames || 0,
        accuracy, globalPosition: position,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ranking/player/:deviceId
router.get('/player/:deviceId', async (req, res) => {
  try {
    const player = await Player.findOne({ deviceId: req.params.deviceId })
      .select('-recentSessions -__v').lean();
    if (!player) return res.status(404).json({ success: false, error: 'Player not found' });

    const position = (await Player.countDocuments({ rankScore: { $gt: player.rankScore || 0 } })) + 1;
    res.json({ success: true, player: { ...player, globalPosition: position } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
