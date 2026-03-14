import React, { useState } from 'react';
import { useSearchParams, useNavigate, createSearchParams } from 'react-router-dom';
import Navbar from './NavBar';
import { handleCreateTeamApi } from '../Services/teamService';
import './Team.css';
 
const LOGO_OPTIONS = [
  '🏆','🔥','⚡','🌸','🐉','🦊','🌙','🎯',
  '🦁','🐺','🎮','🌊','🍀','🌟','🎸','🦋',
];
 
function TeamCreate() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();
 
  const [teamName, setTeamName] = useState('');
  const [logo, setLogo]         = useState('🏆');
  const [errMsg, setErrMsg]     = useState('');
  const [loading, setLoading]   = useState(false);
 
  const handleCreate = async () => {
    setErrMsg('');
    if (!teamName.trim()) { setErrMsg('Please enter a team name.'); return; }
    setLoading(true);
    try {
      await handleCreateTeamApi(id, teamName.trim(), logo);
      navigate({ pathname: '/TeamPage', search: createSearchParams({ id }).toString() });
    } catch (err) {
      setErrMsg(err?.response?.data?.error || 'Failed to create team.');
    } finally {
      setLoading(false);
    }
  };
 
  const handleBack = () => {
    navigate({ pathname: '/TeamLobby', search: createSearchParams({ id }).toString() });
  };
 
  return (
    <div className="team-page-bg">
      <Navbar id={id} />
      <div className="team-center">
        <div className="team-card">
          <div className="team-card-logo">{logo}</div>
          <h1 className="team-card-title">Create a Team</h1>
 
          <div className="team-section">
            <label className="team-label">Team Name</label>
            <input
              className="team-input"
              type="text"
              placeholder="Enter your team name..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              maxLength={30}
            />
          </div>
 
          <div className="team-section">
            <label className="team-label">Choose a Logo</label>
            <div className="logo-grid">
              {LOGO_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  className={`logo-option ${logo === emoji ? 'logo-selected' : ''}`}
                  onClick={() => setLogo(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
 
          {errMsg && <p className="team-error">{errMsg}</p>}
 
          <div className="team-btn-row">
            <button className="team-btn-secondary" onClick={handleBack}>
              Back
            </button>
            <button className="team-btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default TeamCreate;