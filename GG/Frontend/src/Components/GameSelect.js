
import { useState, useEffect } from 'react';
import React from 'react';
import { createSearchParams, useSearchParams, useNavigate } from 'react-router-dom';
import './GameSelect.css';
import { handleGetUserStatsApi } from '../Services/gameSelectionService';
import Navbar from './NavBar';
import { handleGetUserQuestsApi } from '../Services/questService';
import { getImageUrl } from '../Services/uploadImageService';

const XP_PER_LEVEL = 500; // Must match the value in gameRoutes.js


function GameSelect() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpToNext, setXpToNext] = useState(XP_PER_LEVEL);
  const [username, setUsername] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 const getStats = async () => {
    try {
      const data = await handleGetUserStatsApi(id);
      setLevel(data.level);
      setXp(data.xp);
      setXpToNext(data.xpToNext);
      setUsername(data.username);
    } catch (err) {
      console.log(err);
      setError('Could not load user data. Please try again.');
    }
  };
 
  const getQuests = async () => {
    try {
      const data = await handleGetUserQuestsApi(id);
      setQuests(data.quests || []);
    } catch (err) {
      console.log('Could not load quests:', err);
      // Non-fatal — page still works without quests
    }
  };
 
  useEffect(() => {
    Promise.all([getStats(), getQuests()]).finally(() => setLoading(false));
  }, []);
 
  const getXpPercent = () => Math.min(100, Math.round((xp / xpToNext) * 100));
  const getInitial   = () => username ? username.charAt(0).toUpperCase() : '?';
 
  const goToTermMatching = () => {
    navigate({ pathname: '/TermMatching', search: createSearchParams({ id }).toString() });
  };
  const goToGrammarQuiz = () => {
    navigate({ pathname: '/GrammarQuiz', search: createSearchParams({ id }).toString() });
  };
  const goToPronunciationDrill = () => {
    navigate({ pathname: '/PronunciationDrill', search: createSearchParams({ id }).toString() });
  };
 
  if (loading) return <div className="loading-state">Loading...</div>;
  if (error)   return <div className="error-state">{error}</div>;
 
  return (
    <div className="game-selection-page">
      <Navbar id={id} />
 
      {/* ── Profile / Level Banner ── */}
      <div className="profile-banner">
        <div className="profile-avatar">
          {profileImage ? (
            <img
              src={getImageUrl(profileImage)}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            getInitial()
          )}
          </div>
 
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
            <div className="xp-bar-fill" style={{ width: `${getXpPercent()}%` }} />
          </div>
          <span className="xp-text">{xp}/{xpToNext}XP</span>
        </div>
      </div>
 
      {/* ── Games + Quests ── */}
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
 
        {/* Right: Quests panel */}
        <div className="quests-panel">
          <h3 className="quests-title">Quests</h3>
 
          {quests.length === 0 ? (
            <p style={{ fontSize: 13, color: '#888', textAlign: 'center', margin: 0 }}>
              No quests available yet.
            </p>
          ) : (
            <div className="quest-list">
              {quests.map((challenge) => {
                const pct = Math.min(100, Math.round((quests.userProgress / challenge.goal) * 100));
                return (
                  <div key={challenge.id} className="quest-item">
                    <div className="quest-text">
                      <div style={{ fontWeight: 'bold', marginBottom: 3 }}>{challenge.title}</div>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>
                        {challenge.description}
                      </div>
                      <div className="challenge-progress-bar-track">
                        <div
                          className="challenge-progress-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: challenge.completed ? '#16a34a' : '#6344A6',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: '#999', textAlign: 'right', marginTop: 2 }}>
                        {quests.userProgress}/{challenge.goal}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      {challenge.completed ? (
                        <div className="quest-done-check">✓</div>
                      ) : (
                        <input
                          type="checkbox"
                          className="quest-checkbox"
                          checked={false}
                          readOnly
                        />
                      )}
                      <span style={{ fontSize: 10, color: '#6344A6', fontWeight: 'bold' }}>
                        +{challenge.xpReward}XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
 
      </div>
    </div>
  );
}
 
export default GameSelect;