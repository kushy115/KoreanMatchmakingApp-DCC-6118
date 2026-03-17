import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, createSearchParams } from 'react-router-dom';
import Navbar from './NavBar';
import {
  handleJoinTeamApi,
  handleGetMyTeamApi,
  handleSearchTeamsApi,
} from '../Services/teamService';
import './Team.css';
 
// Three ways to join: invite code, search by name, or create new
const JOIN_TABS = ['Invite Code', 'Search Teams', 'Create Team'];
 
function TeamLobby() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();
 
  const [activeTab, setActiveTab]       = useState('Invite Code');
  const [inviteCode, setInviteCode]     = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);
  const [errMsg, setErrMsg]             = useState('');
  const [loading, setLoading]           = useState(true);
 
  // Redirect to TeamPage if already in a team
  useEffect(() => {
    const checkTeam = async () => {
      try {
        const data = await handleGetMyTeamApi(id);
        if (data.team) {
          navigate({ pathname: '/TeamPage', search: createSearchParams({ id }).toString() });
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    checkTeam();
  }, [id]);
 
  const handleJoinByCode = async () => {
    setErrMsg('');
    if (!inviteCode.trim()) { setErrMsg('Please enter an invite code.'); return; }
    try {
      await handleJoinTeamApi(id, inviteCode.trim());
      navigate({ pathname: '/TeamPage', search: createSearchParams({ id }).toString() });
    } catch (err) {
      setErrMsg(err?.response?.data?.error || 'Failed to join team.');
    }
  };
 
  const handleSearch = async () => {
    setErrMsg('');
    if (!searchQuery.trim()) { setErrMsg('Enter a team name to search.'); return; }
    setSearching(true);
    try {
      const data = await handleSearchTeamsApi(searchQuery.trim());
      setSearchResults(data.teams || []);
      if ((data.teams || []).length === 0) setErrMsg('No teams found.');
    } catch (err) {
      setErrMsg('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };
 
  const handleJoinFromSearch = async (teamInviteCode) => {
    setErrMsg('');
    try {
      await handleJoinTeamApi(id, teamInviteCode);
      navigate({ pathname: '/TeamPage', search: createSearchParams({ id }).toString() });
    } catch (err) {
      setErrMsg(err?.response?.data?.error || 'Failed to join team.');
    }
  };
 
  const goCreate = () => {
    navigate({ pathname: '/TeamCreate', search: createSearchParams({ id }).toString() });
  };
 
  if (loading) return <div className="team-loading">Loading...</div>;
 
  return (
    <div className="team-page-bg">
      
      <div className="team-center">
        <Navbar id={id} />
        <div className="team-card">
          <div className="team-card-logo">👥</div>
          <h1 className="team-card-title">Teams</h1>
          <p className="team-card-subtitle">
            Join a team and complete challenges together!
          </p>
 
          {/* Tab switcher */}
          <div className="team-tabs">
            {JOIN_TABS.map((tab) => (
              <button
                key={tab}
                className={`team-tab ${activeTab === tab ? 'team-tab-active' : ''}`}
                onClick={() => { setActiveTab(tab); setErrMsg(''); setSearchResults([]); }}
              >
                {tab}
              </button>
            ))}
          </div>
 
          {/* ── Tab: Invite Code ── */}
          {activeTab === 'Invite Code' && (
            <div className="team-section">
              <p className="team-section-desc">Enter an invite code from a team owner.</p>
              <input
                className="team-input"
                type="text"
                placeholder="Enter invite code (e.g. AB12CD)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
              {errMsg && <p className="team-error">{errMsg}</p>}
              <button className="team-btn-primary" onClick={handleJoinByCode}>
                Join Team
              </button>
            </div>
          )}
 
          {/* ── Tab: Search Teams ── */}
          {activeTab === 'Search Teams' && (
            <div className="team-section">
              <p className="team-section-desc">Search for a public team by name.</p>
              <div className="team-search-row">
                <input
                  className="team-input"
                  type="text"
                  placeholder="Search team name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  className="team-btn-primary"
                  onClick={handleSearch}
                  disabled={searching}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {searching ? '...' : 'Search'}
                </button>
              </div>
              {errMsg && <p className="team-error">{errMsg}</p>}
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((team) => (
                    <div key={team.id} className="search-result-row">
                      <span className="search-result-logo">{team.logo}</span>
                      <span className="search-result-name">{team.name}</span>
                      <span className="search-result-xp">{team.totalXP} XP</span>
                      <button
                        className="team-btn-primary"
                        style={{ padding: '6px 14px', fontSize: 13 }}
                        onClick={() => handleJoinFromSearch(team.inviteCode)}
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
 
          {/* ── Tab: Create Team ── */}
          {activeTab === 'Create Team' && (
            <div className="team-section">
              <p className="team-section-desc">Start your own team and invite others.</p>
              <button className="team-btn-primary" onClick={goCreate}>
                Create New Team →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 
export default TeamLobby;