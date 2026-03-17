import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getUserChallenges,
  acceptChallenge,
  declineChallenge,
  createChallenge,
  getChallengeStats,
} from '../Services/challengeService';
import { handleGetUserStatsApi } from '../Services/gameSelectionService';
import Navbar from './NavBar';
import './ChallengeHub.css';

function ChallengeHub() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [friendId, setFriendId] = useState('');
  const [gameType, setGameType] = useState('term-matching');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [friends, setFriends] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [challengeData, statsData] = await Promise.all([
        getUserChallenges(id),
        getChallengeStats(id),
      ]);
      setChallenges(challengeData.challenges || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const { default: axios } = await import('../Utils/axios');
      const res = await axios.get(`/api/v1/friends/${id}`);
      setFriends(res.friends || res || []);
    } catch (err) {
      console.error('Could not load friends:', err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAccept = async (challengeId) => {
    try {
      await acceptChallenge(challengeId);
      loadData();
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const handleDecline = async (challengeId) => {
    try {
      await declineChallenge(challengeId);
      loadData();
    } catch (err) {
      console.error('Failed to decline:', err);
    }
  };

  const handleCreate = async () => {
    if (!friendId) return;
    try {
      await createChallenge(id, friendId, gameType, difficulty);
      setShowCreate(false);
      setFriendId('');
      loadData();
    } catch (err) {
      console.error('Failed to create challenge:', err);
    }
  };

  const handlePlayChallenge = (challenge) => {
    const gameRoutes = {
      'term-matching': '/TermMatching',
      'grammar-quiz': '/GrammarQuiz',
      'pronunciation-drill': '/PronunciationDrill',
    };
    const path = gameRoutes[challenge.gameType] || '/GameSelection';
    navigate(`${path}?id=${id}&challengeId=${challenge.id}`);
  };

  const filtered = challenges.filter(c => {
    if (tab === 'pending') return c.status === 'pending' && Number(c.challengedId) === Number(id);
    if (tab === 'active') return ['accepted', 'in_progress'].includes(c.status);
    if (tab === 'sent') return c.status === 'pending' && Number(c.challengerId) === Number(id);
    if (tab === 'completed') return c.status === 'completed';
    return true;
  });

  const getOpponentName = (c) => {
    if (Number(c.challengerId) === Number(id)) {
      return c.challenged ? `${c.challenged.firstName} ${c.challenged.lastName || ''}`.trim() : `User #${c.challengedId}`;
    }
    return c.challenger ? `${c.challenger.firstName} ${c.challenger.lastName || ''}`.trim() : `User #${c.challengerId}`;
  };

  const gameLabel = (gt) => {
    const labels = { 'term-matching': 'Term Matching', 'grammar-quiz': 'Grammar Quiz', 'pronunciation-drill': 'Pronunciation Drill' };
    return labels[gt] || gt;
  };

  const statusBadge = (status) => {
    const colors = { pending: '#f59e0b', accepted: '#3b82f6', in_progress: '#6344A6', completed: '#16a34a', declined: '#dc2626', expired: '#888' };
    return <span className="ch-status-badge" style={{ background: colors[status] || '#888' }}>{status}</span>;
  };

  if (loading) return <div className="ch-loading">Loading...</div>;

  return (
    <div className="ch-page">
      <Navbar id={id} />
      <div className="ch-page-content">
      <div className="ch-container">
        <div className="ch-header">
          <h2 className="ch-title">1v1 Challenges</h2>
          <button className="ch-create-btn" onClick={() => { setShowCreate(!showCreate); loadFriends(); }}>
            {showCreate ? 'Cancel' : '+ Challenge a Friend'}
          </button>
        </div>

        {stats && (
          <div className="ch-stats-bar">
            <div className="ch-stat"><span className="ch-stat-val">{stats.totalChallenges}</span><span className="ch-stat-label">Played</span></div>
            <div className="ch-stat"><span className="ch-stat-val">{stats.wins}</span><span className="ch-stat-label">Wins</span></div>
            <div className="ch-stat"><span className="ch-stat-val">{stats.losses}</span><span className="ch-stat-label">Losses</span></div>
            <div className="ch-stat"><span className="ch-stat-val">{stats.draws}</span><span className="ch-stat-label">Draws</span></div>
            <div className="ch-stat"><span className="ch-stat-val">{stats.winRate}%</span><span className="ch-stat-label">Win Rate</span></div>
          </div>
        )}

        {showCreate && (
          <div className="ch-create-form">
            <h4>Send a Challenge</h4>
            <div className="ch-form-row">
              <label>Opponent</label>
              <input
                type="number"
                placeholder="Friend's User ID"
                value={friendId}
                onChange={e => setFriendId(e.target.value)}
                className="ch-input"
              />
            </div>
            <div className="ch-form-row">
              <label>Game</label>
              <select value={gameType} onChange={e => setGameType(e.target.value)} className="ch-select">
                <option value="term-matching">Term Matching</option>
                <option value="grammar-quiz">Grammar Quiz</option>
                <option value="pronunciation-drill">Pronunciation Drill</option>
              </select>
            </div>
            <div className="ch-form-row">
              <label>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="ch-select">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <button className="ch-send-btn" onClick={handleCreate} disabled={!friendId}>
              Send Challenge
            </button>
          </div>
        )}

        <div className="ch-tabs">
          {['pending', 'active', 'sent', 'completed'].map(t => (
            <button key={t} className={`ch-tab ${tab === t ? 'ch-tab-active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="ch-list">
          {filtered.length === 0 ? (
            <p className="ch-empty">No {tab} challenges.</p>
          ) : (
            filtered.map(c => (
              <div key={c.id} className="ch-card">
                <div className="ch-card-top">
                  <div className="ch-opponent">vs {getOpponentName(c)}</div>
                  {statusBadge(c.status)}
                </div>
                <div className="ch-card-details">
                  <span className="ch-game-label">{gameLabel(c.gameType)}</span>
                  <span className="ch-difficulty">{c.difficulty}</span>
                </div>

                {c.status === 'completed' && (
                  <div className="ch-score-row">
                    <span>
                      {c.challenger?.firstName}: {c.challengerScore ?? '—'} |{' '}
                      {c.challenged?.firstName}: {c.challengedScore ?? '—'}
                    </span>
                    {c.winnerId && (
                      <span className="ch-winner">
                        {Number(c.winnerId) === Number(id) ? 'You Won!' : 'You Lost'}
                      </span>
                    )}
                    {!c.winnerId && <span className="ch-draw">Draw</span>}
                  </div>
                )}

                <div className="ch-card-actions">
                  {c.status === 'pending' && Number(c.challengedId) === Number(id) && (
                    <>
                      <button className="ch-accept-btn" onClick={() => handleAccept(c.id)}>Accept</button>
                      <button className="ch-decline-btn" onClick={() => handleDecline(c.id)}>Decline</button>
                    </>
                  )}
                  {['accepted', 'in_progress'].includes(c.status) && (
                    <button className="ch-play-btn" onClick={() => handlePlayChallenge(c)}>Play Now</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default ChallengeHub;
