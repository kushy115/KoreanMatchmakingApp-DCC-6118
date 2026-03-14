import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, createSearchParams } from 'react-router-dom';
import Navbar from './NavBar';
import {
  handleGetMyTeamApi,
  handleUpdateTeamApi,
  handleKickMemberApi,
  handleLeaveTeamApi,
  handleDisbandTeamApi,
  handleGetInviteCodeApi,
} from '../Services/teamService';
import './Team.css';
 
const LOGO_OPTIONS = [
  '🏆','🔥','⚡','🌸','🐉','🦊','🌙','🎯',
  '🦁','🐺','🎮','🌊','🍀','🌟','🎸','🦋',
];
 
// Shared team challenges — tied to the games on the Game Selection screen
const TEAM_CHALLENGES = [
  {
    id: 1,
    title: 'Team Term Blitz',
    desc: 'Members play Term Matching a combined 20 times',
    goal: 20,
    icon: '🃏',
    xpReward: 500,
  },
  {
    id: 2,
    title: 'Grammar Champions',
    desc: 'Any member scores 100% on Grammar Quiz 5 times',
    goal: 5,
    icon: '📝',
    xpReward: 400,
  },
  {
    id: 3,
    title: 'Pronunciation Masters',
    desc: 'Complete 10 Pronunciation Drill sessions as a team',
    goal: 10,
    icon: '🎙️',
    xpReward: 600,
  },
  {
    id: 4,
    title: 'Speed Team',
    desc: 'A member finishes Term Matching under 15 seconds 3 times',
    goal: 3,
    icon: '⚡',
    xpReward: 300,
  },
];
 
// Mock progress — replace with real DB values once game completion tracking is added
const MOCK_PROGRESS = { 1: 7, 2: 3, 3: 4, 4: 1 };
 
function TeamPage() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();
 
  const [team, setTeam]             = useState(null);
  const [myRole, setMyRole]         = useState('member');
  const [loading, setLoading]       = useState(true);
  const [errMsg, setErrMsg]         = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
 
  // Edit mode
  const [editing, setEditing]   = useState(false);
  const [editName, setEditName] = useState('');
  const [editLogo, setEditLogo] = useState('');
 
  // Active section tab
  const [section, setSection] = useState('members'); // 'members' | 'challenges'
 
  const fetchTeam = async () => {
    try {
      const data = await handleGetMyTeamApi(id);
      if (!data.team) {
        navigate({ pathname: '/TeamLobby', search: createSearchParams({ id }).toString() });
        return;
      }
      setTeam(data.team);
      setMyRole(data.myRole);
      setEditName(data.team.name);
      setEditLogo(data.team.logo);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => { fetchTeam(); }, [id]);
 
  const flash = (msg, isError = false) => {
    if (isError) { setErrMsg(msg); setTimeout(() => setErrMsg(''), 3000); }
    else { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); }
  };
 
  const handleCopyCode = () => {
    navigator.clipboard.writeText(team.inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };
 
  const handleSaveEdit = async () => {
    setErrMsg('');
    try {
      await handleUpdateTeamApi(id, editName, editLogo);
      setEditing(false);
      flash('Team updated!');
      fetchTeam();
    } catch (err) {
      flash(err?.response?.data?.error || 'Failed to update team.', true);
    }
  };
 
  const handleKick = async (targetUserId, targetName) => {
    if (!window.confirm(`Kick ${targetName} from the team?`)) return;
    try {
      await handleKickMemberApi(id, targetUserId);
      flash(`${targetName} was removed.`);
      fetchTeam();
    } catch (err) {
      flash(err?.response?.data?.error || 'Failed to kick member.', true);
    }
  };
 
  const handleLeave = async () => {
    if (!window.confirm('Leave this team?')) return;
    try {
      await handleLeaveTeamApi(id);
      navigate({ pathname: '/TeamLobby', search: createSearchParams({ id }).toString() });
    } catch (err) {
      flash(err?.response?.data?.error || 'Failed to leave team.', true);
    }
  };
 
  const handleDisband = async () => {
    if (!window.confirm('Disband the team? This cannot be undone.')) return;
    try {
      await handleDisbandTeamApi(id);
      navigate({ pathname: '/TeamLobby', search: createSearchParams({ id }).toString() });
    } catch (err) {
      flash(err?.response?.data?.error || 'Failed to disband team.', true);
    }
  };
 
  if (loading) return <div className="team-loading">Loading...</div>;
  if (!team)   return null;
 
  const sortedMembers = [...(team.members || [])].sort(
    (a, b) => (b.user?.xp ?? 0) - (a.user?.xp ?? 0)
  );
  const totalXP = sortedMembers.reduce((sum, m) => sum + (m.user?.xp ?? 0), 0);
  const completedChallenges = TEAM_CHALLENGES.filter(
    (c) => (MOCK_PROGRESS[c.id] ?? 0) >= c.goal
  ).length;
 
  return (
    <div className="team-page-bg">
      
      <div className="team-center">
        <Navbar id={id} />
        {/* ── Team Header Card ── */}
        <div className="team-card">
          {editing ? (
            <>
              <div className="logo-grid" style={{ marginBottom: 12 }}>
                {LOGO_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    className={`logo-option ${editLogo === emoji ? 'logo-selected' : ''}`}
                    onClick={() => setEditLogo(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                className="team-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={30}
              />
              {errMsg && <p className="team-error">{errMsg}</p>}
              <div className="team-btn-row">
                <button className="team-btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="team-btn-primary"   onClick={handleSaveEdit}>Save</button>
              </div>
            </>
          ) : (
            <>
              <div className="team-card-logo">{team.logo}</div>
              <h1 className="team-card-title">{team.name}</h1>
 
              {/* Stats row */}
              <div className="team-stats-row">
                <div className="team-stat">
                  <span className="team-stat-num">{sortedMembers.length}</span>
                  <span className="team-stat-lbl">Members</span>
                </div>
                <div className="team-stat-divider" />
                <div className="team-stat">
                  <span className="team-stat-num">{totalXP.toLocaleString()}</span>
                  <span className="team-stat-lbl">Team XP</span>
                </div>
                <div className="team-stat-divider" />
                <div className="team-stat">
                  <span className="team-stat-num">{completedChallenges}/{TEAM_CHALLENGES.length}</span>
                  <span className="team-stat-lbl">Challenges</span>
                </div>
              </div>
 
              {/* Invite code with copy button */}
              <div className="team-invite-row">
                <span className="team-invite-label">Invite Code:</span>
                <span className="team-invite-code">{team.inviteCode}</span>
                <button className="team-copy-btn" onClick={handleCopyCode}>
                  {codeCopied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
 
              {successMsg && <p className="team-success">{successMsg}</p>}
              {errMsg     && <p className="team-error">{errMsg}</p>}
 
              <div className="team-btn-row">
                {myRole === 'owner' && (
                  <>
                    <button className="team-btn-secondary" onClick={() => setEditing(true)}>
                      ✏️ Edit Team
                    </button>
                    <button className="team-btn-danger" onClick={handleDisband}>
                      Disband
                    </button>
                  </>
                )}
                {myRole === 'member' && (
                  <button className="team-btn-danger" onClick={handleLeave}>
                    Leave Team
                  </button>
                )}
              </div>
            </>
          )}
        </div>
 
        {/* ── Section tabs ── */}
        <div className="team-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="team-section-tabs">
            <button
              className={`team-section-tab ${section === 'members' ? 'team-section-tab-active' : ''}`}
              onClick={() => setSection('members')}
            >
              👥 Members
            </button>
            <button
              className={`team-section-tab ${section === 'challenges' ? 'team-section-tab-active' : ''}`}
              onClick={() => setSection('challenges')}
            >
              🎯 Challenges
            </button>
          </div>
 
          <div style={{ padding: '20px 28px 24px' }}>
 
            {/* ── Members & Leaderboard ── */}
            {section === 'members' && (
              <>
                <h2 className="team-section-title" style={{ marginBottom: 14 }}>
                  👑 Member Leaderboard
                </h2>
                <div className="leaderboard-list">
                  {sortedMembers.map((member, index) => {
                    const isMe   = String(member.userId) === String(id);
                    const name   = member.user ? `${member.user.firstName} ${member.user.lastName}` : 'Unknown';
                    const xp     = member.user?.xp    ?? 0;
                    const level  = member.user?.level  ?? 1;
                    return (
                      <div key={member.id} className={`leaderboard-row ${isMe ? 'leaderboard-me' : ''}`}>
                        <span className="leaderboard-rank">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <span className="leaderboard-name">
                          {name}
                          {member.role === 'owner' && <span className="owner-badge"> 👑 Owner</span>}
                          {isMe && <span className="me-badge"> (you)</span>}
                        </span>
                        <span className="leaderboard-level">Lv.{level}</span>
                        <span className="leaderboard-xp">{xp.toLocaleString()} XP</span>
                        {myRole === 'owner' && !isMe && member.role !== 'owner' && (
                          <button className="kick-btn" onClick={() => handleKick(member.userId, name)}>
                            Kick
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
 
            {/* ── Shared Challenges ── */}
            {section === 'challenges' && (
              <>
                <h2 className="team-section-title" style={{ marginBottom: 14 }}>
                  🎯 Team Challenges
                </h2>
                <div className="challenge-progress-list">
                  {TEAM_CHALLENGES.map((challenge) => {
                    const progress  = MOCK_PROGRESS[challenge.id] ?? 0;
                    const pct       = Math.min(100, Math.round((progress / challenge.goal) * 100));
                    const completed = progress >= challenge.goal;
                    return (
                      <div key={challenge.id} className={`challenge-progress-card ${completed ? 'challenge-done' : ''}`}>
                        <div className="challenge-progress-top">
                          <span className="challenge-progress-icon">{challenge.icon}</span>
                          <div className="challenge-progress-info">
                            <span className="challenge-progress-title">{challenge.title}</span>
                            <span className="challenge-progress-desc">{challenge.desc}</span>
                          </div>
                          <span className="challenge-progress-xp">+{challenge.xpReward} XP</span>
                          {completed && <span className="challenge-done-badge">✓</span>}
                        </div>
                        <div className="challenge-progress-bar-track">
                          <div
                            className="challenge-progress-bar-fill"
                            style={{
                              width: `${pct}%`,
                              background: completed ? '#16a34a' : '#6344A6',
                            }}
                          />
                        </div>
                        <span className="challenge-progress-count">
                          {progress} / {challenge.goal}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
 
          </div>
        </div>
 
      </div>
    </div>
  );
}
 
export default TeamPage;