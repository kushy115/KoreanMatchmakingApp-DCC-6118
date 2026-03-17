import express from 'express';
import db from '../models/index.js';

const router = express.Router();

// POST /api/challenges  — send a challenge to another user
router.post('/', async (req, res) => {
  try {
    const { challengerId, challengedId, gameType, difficulty } = req.body;
    if (!challengerId || !challengedId || !gameType) {
      return res.status(400).json({ error: 'challengerId, challengedId, and gameType are required' });
    }
    if (Number(challengerId) === Number(challengedId)) {
      return res.status(400).json({ error: 'Cannot challenge yourself' });
    }

    const challenge = await db.Challenge.create({
      challengerId,
      challengedId,
      gameType,
      difficulty: difficulty || 'Beginner',
      status: 'pending',
    });

    return res.status(201).json({ challenge });
  } catch (err) {
    console.error('Error creating challenge:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/challenges/user/:userId  — get all challenges for a user (sent & received)
router.get('/user/:userId', async (req, res) => {
  try {
    const { Op } = await import('sequelize');
    const { userId } = req.params;
    const { status } = req.query;

    const where = {
      [Op.or]: [{ challengerId: userId }, { challengedId: userId }],
    };
    if (status) where.status = status;

    const challenges = await db.Challenge.findAll({
      where,
      include: [
        { model: db.UserAccount, as: 'challenger', attributes: ['id', 'firstName', 'lastName'] },
        { model: db.UserAccount, as: 'challenged', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ challenges });
  } catch (err) {
    console.error('Error fetching challenges:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/challenges/:id  — get a specific challenge
router.get('/:id', async (req, res) => {
  try {
    const challenge = await db.Challenge.findByPk(req.params.id, {
      include: [
        { model: db.UserAccount, as: 'challenger', attributes: ['id', 'firstName', 'lastName'] },
        { model: db.UserAccount, as: 'challenged', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    return res.status(200).json({ challenge });
  } catch (err) {
    console.error('Error fetching challenge:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/challenges/:id/accept  — accept a challenge
router.put('/:id/accept', async (req, res) => {
  try {
    const challenge = await db.Challenge.findByPk(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: `Challenge is already ${challenge.status}` });
    }

    await challenge.update({ status: 'accepted' });
    return res.status(200).json({ challenge });
  } catch (err) {
    console.error('Error accepting challenge:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/challenges/:id/decline  — decline a challenge
router.put('/:id/decline', async (req, res) => {
  try {
    const challenge = await db.Challenge.findByPk(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: `Challenge is already ${challenge.status}` });
    }

    await challenge.update({ status: 'declined' });
    return res.status(200).json({ challenge });
  } catch (err) {
    console.error('Error declining challenge:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/challenges/:id/submit-score  — submit a player's score for a challenge
router.post('/:id/submit-score', async (req, res) => {
  try {
    const { userId, score } = req.body;
    if (!userId || score === undefined) {
      return res.status(400).json({ error: 'userId and score are required' });
    }

    const challenge = await db.Challenge.findByPk(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    if (!['accepted', 'in_progress'].includes(challenge.status)) {
      return res.status(400).json({ error: `Challenge is ${challenge.status}, cannot submit score` });
    }

    const updates = { status: 'in_progress' };
    if (Number(userId) === challenge.challengerId) {
      updates.challengerScore = score;
    } else if (Number(userId) === challenge.challengedId) {
      updates.challengedScore = score;
    } else {
      return res.status(403).json({ error: 'User is not part of this challenge' });
    }

    await challenge.update(updates);
    await challenge.reload();

    if (challenge.challengerScore !== null && challenge.challengedScore !== null) {
      let winnerId = null;
      if (challenge.challengerScore > challenge.challengedScore) winnerId = challenge.challengerId;
      else if (challenge.challengedScore > challenge.challengerScore) winnerId = challenge.challengedId;

      await challenge.update({
        status: 'completed',
        winnerId,
        completedAt: new Date(),
      });
    }

    return res.status(200).json({ challenge });
  } catch (err) {
    console.error('Error submitting challenge score:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/challenges/user/:userId/stats  — get challenge stats for a user
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const totalChallenges = await db.Challenge.count({
      where: {
        [db.Sequelize.Op.or]: [{ challengerId: userId }, { challengedId: userId }],
        status: 'completed',
      },
    });

    const wins = await db.Challenge.count({
      where: { winnerId: userId },
    });

    const draws = await db.Challenge.count({
      where: {
        [db.Sequelize.Op.or]: [{ challengerId: userId }, { challengedId: userId }],
        status: 'completed',
        winnerId: null,
      },
    });

    return res.status(200).json({
      totalChallenges,
      wins,
      losses: totalChallenges - wins - draws,
      draws,
      winRate: totalChallenges > 0 ? Math.round((wins / totalChallenges) * 100) : 0,
    });
  } catch (err) {
    console.error('Error fetching challenge stats:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
