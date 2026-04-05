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

    const now = Date.now();

    // ── Bayesian Adjusted Accuracy + Log Confidence ──────────────────────────
    // Formula: score = adj_accuracy × confidence × 1000
    // adj_accuracy = (correct + α) / (total + α + β)   [Laplace smoothing]
    // confidence   = log(1 + games) / log(1 + C)        [log scaling, capped 1]
    // α=3, β=3 (prior pessimista), C=30 (jogos para confiança máxima)
    const ALPHA = 3, BETA = 3, C_MAX = 30;

    function bayesianScore(games, correct, total) {
      if (total === 0) return 0;
      const adjAcc    = (correct + ALPHA) / (total + ALPHA + BETA);
      const confidence = Math.min(Math.log(1 + games) / Math.log(1 + C_MAX), 1);
      return Math.round(adjAcc * confidence * 1000);
    }

    const ranked = players
      .map(p => {
        const games   = p.totalGames            || 0;
        const correct = p.totalWeightedCorrect  || p.totalCorrect   || 0;
        const total   = p.totalWeightedQuestions|| p.totalQuestions || 0;

        const rankScore  = bayesianScore(games, correct, total);
        const accuracy   = total > 0 ? Math.round((p.totalCorrect / p.totalQuestions) * 100) : 0;
        const adjAcc     = total > 0
          ? Math.round(((correct + ALPHA) / (total + ALPHA + BETA)) * 100) : 0;
        const confidence = Math.round(
          Math.min(Math.log(1 + games) / Math.log(1 + C_MAX), 1) * 100
        );
        const cutoff    = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const recentGames = (p.recentSessions || [])
          .filter(s => new Date(s.playedAt) >= cutoff).length;

        return {
          name:        p.name,
          email:       p.email,
          rankScore,
          bestScore:   p.bestScore || 0,
          totalGames:  games,
          accuracy,
          adjAcc,
          confidence,
          recentGames,
          maxStreak:   p.maxStreak || 0,
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
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = (player.recentSessions || []).filter(s => new Date(s.playedAt) >= cutoff).length;

    // Bayesian score: adj_accuracy × log_confidence × 1000
    const ALPHA = 3, BETA = 3, C_MAX = 30;
    const pCorrect = player.totalWeightedCorrect  || player.totalCorrect   || 0;
    const pTotal   = player.totalWeightedQuestions|| player.totalQuestions || 0;
    const pGames   = player.totalGames || 0;
    const adjAcc   = pTotal > 0 ? (pCorrect + ALPHA) / (pTotal + ALPHA + BETA) : 0;
    const conf     = Math.min(Math.log(1 + pGames) / Math.log(1 + C_MAX), 1);
    const rankScore = Math.round(adjAcc * conf * 1000);

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
