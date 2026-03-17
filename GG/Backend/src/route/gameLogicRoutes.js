import express from 'express';
import db from '../models/index.js';
import {
  getTermMatchingRound,
  gradeTermMatching,
  getGrammarQuizRound,
  gradeGrammarQuiz,
  getPronunciationDrillRound,
} from '../Service/gameContentService.js';
import { incrementGameStat, checkAndAwardBadges } from '../Service/milestoneService.js';

const router = express.Router();
const XP_PER_LEVEL = 500;

const activeSessions = new Map();

function storeSession(userId, gameType, data) {
  activeSessions.set(`${userId}:${gameType}`, { ...data, startedAt: Date.now() });
}

function getSession(userId, gameType) {
  return activeSessions.get(`${userId}:${gameType}`) || null;
}

function clearSession(userId, gameType) {
  activeSessions.delete(`${userId}:${gameType}`);
}

async function awardXp(userId, xpAmount) {
  const user = await db.UserAccount.findByPk(userId);
  if (!user) return null;

  let newXp = user.xp + xpAmount;
  let newLevel = user.level;
  let leveledUp = false;

  while (newXp >= newLevel * XP_PER_LEVEL) {
    newXp -= newLevel * XP_PER_LEVEL;
    newLevel++;
    leveledUp = true;
  }

  await user.update({ xp: newXp, level: newLevel });
  return { xp: newXp, level: newLevel, xpToNext: newLevel * XP_PER_LEVEL, leveledUp };
}

async function incrementQuests(userId, gameType) {
  try {
    if (!db.Quest || !db.UserQuestProgress) return [];
    const { Op } = await import('sequelize');
    const quests = await db.Quest.findAll({
      where: {
        isActive: true,
        type: 'individual',
        gameType: { [Op.or]: [gameType, null] },
      },
    });

    const updated = [];
    for (const quest of quests) {
      const [progress] = await db.UserQuestProgress.findOrCreate({
        where: { userId, questId: quest.id },
        defaults: { progress: 0, completed: false, lastResetAt: new Date() },
      });

      if (progress.completed && quest.resetType === 'permanent') continue;

      const newProgress = progress.progress + 1;
      const nowComplete = newProgress >= quest.goal;

      await progress.update({
        progress: newProgress,
        completed: nowComplete,
        completedAt: nowComplete && !progress.completed ? new Date() : progress.completedAt,
      });

      if (nowComplete && !progress.completed) {
        await awardXp(userId, quest.xpReward);
      }

      updated.push({ questId: quest.id, progress: newProgress, completed: nowComplete });
    }

    return updated;
  } catch (err) {
    console.warn('incrementQuests failed (non-fatal):', err.message);
    return [];
  }
}

async function saveGameSession(userId, gameType, difficulty, result, challengeId = null) {
  try {
    if (db.GameSession) {
      await db.GameSession.create({
        userId,
        gameType,
        difficulty,
        score: result.score,
        correct: result.correct || null,
        total: result.total || null,
        xpEarned: result.xpEarned || 0,
        status: 'completed',
        challengeId,
        completedAt: new Date(),
      });
    }
  } catch (err) {
    console.error('Failed to persist game session (non-fatal):', err.message);
  }
}

// GET /api/games/sessions/:userId — game history
router.get('/sessions/:userId', async (req, res) => {
  try {
    if (!db.GameSession) return res.status(200).json({ sessions: [] });

    const sessions = await db.GameSession.findAll({
      where: { userId: req.params.userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    return res.status(200).json({ sessions });
  } catch (err) {
    console.error('Error fetching game sessions:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Term Matching ───

router.post('/term-matching/start', async (req, res) => {
  try {
    const { userId, difficulty = 'Beginner', count = 6, challengeId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const round = getTermMatchingRound(difficulty, count);
    storeSession(userId, 'term-matching', { pairs: round.pairs, difficulty, challengeId });

    return res.status(200).json({
      pairs: round.pairs.map(p => ({ id: p.id, korean: p.korean })),
      englishOptions: round.shuffledEnglish,
    });
  } catch (err) {
    console.error('Error starting term matching:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/term-matching/submit', async (req, res) => {
  try {
    const { userId, answers } = req.body;
    if (!userId || !answers) return res.status(400).json({ error: 'userId and answers are required' });

    const session = getSession(userId, 'term-matching');
    if (!session) return res.status(400).json({ error: 'No active term matching session. Call /start first.' });

    const result = gradeTermMatching(session.pairs, answers);
    clearSession(userId, 'term-matching');

    const xpEarned = Math.round(result.score * 0.5);

    await incrementGameStat(userId, 'term_matching_played');
    if (result.score === 100) await incrementGameStat(userId, 'perfect_score');

    const xpResult = await awardXp(userId, xpEarned);
    const questUpdates = await incrementQuests(userId, 'term-matching');
    const newBadges = await checkAndAwardBadges(userId);

    await saveGameSession(userId, 'term-matching', session.difficulty, { ...result, xpEarned }, session.challengeId);

    return res.status(200).json({
      ...result,
      correctPairs: session.pairs,
      xpEarned,
      xp: xpResult,
      questUpdates,
      newBadges,
    });
  } catch (err) {
    console.error('Error submitting term matching:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Grammar Quiz ───

router.post('/grammar-quiz/start', async (req, res) => {
  try {
    const { userId, difficulty = 'Beginner', count = 5, challengeId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const questions = getGrammarQuizRound(difficulty, count);
    storeSession(userId, 'grammar-quiz', { questions, difficulty, challengeId });

    return res.status(200).json({ questions });
  } catch (err) {
    console.error('Error starting grammar quiz:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/grammar-quiz/submit', async (req, res) => {
  try {
    const { userId, answers } = req.body;
    if (!userId || !answers) return res.status(400).json({ error: 'userId and answers are required' });

    const session = getSession(userId, 'grammar-quiz');
    if (!session) return res.status(400).json({ error: 'No active grammar quiz session. Call /start first.' });

    const result = gradeGrammarQuiz(session.difficulty, session.questions, answers);
    clearSession(userId, 'grammar-quiz');

    const xpEarned = Math.round(result.score * 0.5);

    await incrementGameStat(userId, 'grammar_quiz_played');
    if (result.score === 100) await incrementGameStat(userId, 'perfect_score');

    const xpResult = await awardXp(userId, xpEarned);
    const questUpdates = await incrementQuests(userId, 'grammar-quiz');
    const newBadges = await checkAndAwardBadges(userId);

    await saveGameSession(userId, 'grammar-quiz', session.difficulty, { ...result, xpEarned }, session.challengeId);

    return res.status(200).json({
      ...result,
      xpEarned,
      xp: xpResult,
      questUpdates,
      newBadges,
    });
  } catch (err) {
    console.error('Error submitting grammar quiz:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Pronunciation Drill ───

router.post('/pronunciation-drill/start', async (req, res) => {
  try {
    const { userId, difficulty = 'Beginner', count = 5, challengeId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const phrases = getPronunciationDrillRound(difficulty, count);
    storeSession(userId, 'pronunciation-drill', { phrases, difficulty, challengeId });

    return res.status(200).json({ phrases });
  } catch (err) {
    console.error('Error starting pronunciation drill:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/pronunciation-drill/submit', async (req, res) => {
  try {
    const { userId, completedCount } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const session = getSession(userId, 'pronunciation-drill');
    if (!session) return res.status(400).json({ error: 'No active pronunciation drill session. Call /start first.' });

    const total = session.phrases.length;
    const completed = Math.min(completedCount || total, total);
    const score = Math.round((completed / total) * 100);
    clearSession(userId, 'pronunciation-drill');

    const xpEarned = Math.round(score * 0.4);

    await incrementGameStat(userId, 'pronunciation_played');
    if (score === 100) await incrementGameStat(userId, 'perfect_score');

    const xpResult = await awardXp(userId, xpEarned);
    const questUpdates = await incrementQuests(userId, 'pronunciation-drill');
    const newBadges = await checkAndAwardBadges(userId);

    await saveGameSession(userId, 'pronunciation-drill', session.difficulty, { score, correct: completed, total, xpEarned }, session.challengeId);

    return res.status(200).json({
      completed,
      total,
      score,
      xpEarned,
      xp: xpResult,
      questUpdates,
      newBadges,
    });
  } catch (err) {
    console.error('Error submitting pronunciation drill:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
