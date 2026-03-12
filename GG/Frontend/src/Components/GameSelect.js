// GameSelection.js
// Place in: GG/Frontend/src/Components/GameSelection/GameSelection.js

import { useState, useEffect } from 'react';
import React from 'react';
import { createSearchParams, useSearchParams, useNavigate } from 'react-router-dom';
import './GameSelect.css';
import { handleGetUserStatsApi } from '../Services/gameSelectionService';

const XP_PER_LEVEL = 500; // Must match the value in gameRoutes.js

const CHALLENGES = [
  { id: 1, text: '+25: Play Term Matching 3 Times' },
  { id: 2, text: '+100: Score 100% on Grammar Quiz' },
  { id: 3, text: '+50: Get a time under 15 seconds in Term Matching' },
];

function GameSelection() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpToNext, setXpToNext] = useState(XP_PER_LEVEL);
  const [username, setUsername] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStats = async () => {
    try {
      const data = await handleGetUserStatsApi(id);
      setLevel(data.level);
      setXp(data.xp);
      setXpToNext(data.xpToNext);
      setUsername(data.username);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setError('Could not load user data. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    getStats();
  }, []);

  const getXpPercent = () => {
    return Math.min(100, Math.round((xp / xpToNext) * 100));
  };

  const getInitial = () => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  const handleChallengeToggle = (challengeId) => {
    setCompletedChallenges((prev) =>
      prev.includes(challengeId)
        ? prev.filter((c) => c !== challengeId)
        : [...prev, challengeId]
    );
  };

  const goToTermMatching = () => {
    navigate({
      pathname: '/TermMatching',
      search: createSearchParams({ id: id }).toString(),
    });
  };

  const goToGrammarQuiz = () => {
    navigate({
      pathname: '/GrammarQuiz',
      search: createSearchParams({ id: id }).toString(),
    });
  };

  const goToPronunciationDrill = () => {
    navigate({
      pathname: '/PronunciationDrill',
      search: createSearchParams({ id: id }).toString(),
    });
  };

  if (loading) {
    return <div className="loading-state">Loading...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div className="game-selection-page">

      {/* ── Profile / Level Banner ── */}
      <div className="profile-banner">
        <div className="profile-avatar">{getInitial()}</div>

        <div className="profile-details">
          <p className="profile-level">Level: {level}</p>
          <div className="profile-difficulty-row">
            <span className="difficulty-label">Difficulty</span>
            <select
              className="difficulty-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="xp-bar-container">
          <div className="xp-bar-track">
            <div
              className="xp-bar-fill"
              style={{ width: `${getXpPercent()}%` }}
            />
          </div>
          <span className="xp-text">{xp}/{xpToNext}XP</span>
        </div>
      </div>

      {/* ── Games + Challenges ── */}
      <div className="game-selection-body">

        {/* Left: Game buttons */}
        <div className="games-column">
          <button className="game-button" onClick={goToTermMatching}>
            Term Matching
          </button>
          <button className="game-button" onClick={goToGrammarQuiz}>
            Grammar Quiz
          </button>
          <button className="game-button" onClick={goToPronunciationDrill}>
            Pronunciation Drill
          </button>
        </div>

        {/* Right: Challenges panel */}
        <div className="challenges-panel">
          <h3 className="challenges-title">Challenges</h3>
          <div className="challenge-list">
            {CHALLENGES.map((challenge) => (
              <div key={challenge.id} className="challenge-item">
                <span className="challenge-text">{challenge.text}</span>
                <input
                  type="checkbox"
                  className="challenge-checkbox"
                  checked={completedChallenges.includes(challenge.id)}
                  onChange={() => handleChallengeToggle(challenge.id)}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default GameSelection;