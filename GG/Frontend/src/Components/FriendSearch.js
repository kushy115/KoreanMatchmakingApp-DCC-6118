import React, { useState, useEffect } from 'react';
import { FiUserPlus } from 'react-icons/fi';
import { DateTime } from "luxon";
import Select from "react-select";

import {
  handleGetUserNamesApi,
  handleGetUserPreferencesApi,
  handleGetUserProfileApi,
} from '../Services/findFriendsService';
import './FriendSearch.css';
import {
  createSearchParams,
  useSearchParams,
  useNavigate,
} from 'react-router-dom';
import { getUserData } from '../Utils/userData';
import {
  handleGetAllInterests,
  handleGetUserInterests,
  handleGetUserAvailability,
  handleAddTrueFriend,
} from '../Services/userService';
import Navbar from './NavBar';

const MBTI_OPTIONS = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP'
].map(v => ({ value: v, label: v }));

const ZODIAC_OPTIONS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
].map(v => ({ value: v, label: v }));

const FILTER_TABS = ['Name', 'MBTI / Zodiac', 'Interests', 'Availability'];

const selectStyles = {
  container: (base) => ({ ...base, width: '100%' }),
  control:   (base, state) => ({
    ...base, minHeight: 38, borderRadius: 8,
    borderColor: state.isFocused ? '#6344A6' : '#d4d4d8',
    boxShadow: 'none', fontSize: 13,
    '&:hover': { borderColor: '#6344A6' }
  }),
  multiValue:       (base) => ({ ...base, background: '#ede9fe' }),
  multiValueLabel:  (base) => ({ ...base, color: '#6344A6', fontSize: 12 }),
  multiValueRemove: (base) => ({ ...base, color: '#6344A6', ':hover': { background: '#6344A6', color: '#fff' } }),
  menu: (base) => ({ ...base, zIndex: 5 })
};

const FriendSearch = () => {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();

  const [filterInput, setFilterInput] = useState('');
  const [userNames, setUserNames] = useState([]);
  const [allUserNames, setAllUserNames] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileBlockedMessage, setProfileBlockedMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedMbti, setSelectedMbti] = useState([]);
  const [selectedZodiac, setSelectedZodiac] = useState([]);
  const [activeFilter, setActiveFilter] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await handleGetUserNamesApi(id);
        const profilesResponse = await handleGetUserPreferencesApi();

        const mergedUsers = await Promise.all(
          userResponse.data.map(async (user) => {
            const userProfile = profilesResponse.data.find((p) => p.id === user.id);
            let userInterests = [];
            try { const r = await handleGetUserInterests(user.id); userInterests = r || []; } catch {}
            let userAvailability = [];
            try { const r = await handleGetUserAvailability(user.id); userAvailability = r || []; } catch {}
            return { ...user, ...userProfile, Interests: userInterests, Availability: userAvailability, score: null };
          })
        );

        const visibleUsers = mergedUsers.filter(
          (u) => u.visibility === 'Show' && Number(u.id) !== Number(id)
        );
        setUserNames(visibleUsers);
        setAllUserNames(visibleUsers);
        setCurrentUser(getUserData());
        setLoading(false);
      } catch (err) {
        const code = err?.response?.data?.code;
        if (code === 'PROFILE_INCOMPLETE') {
          setProfileBlockedMessage(
            err?.response?.data?.message || 'Complete your profile before finding friends.'
          );
          setError(null);
        } else {
          setError(err);
        }
        setLoading(false);
      }
    };
    fetchUserData();

    const fetchInterests = async () => {
      try {
        const res = await handleGetAllInterests();
        const raw = res?.data ?? res;
        const names = Array.isArray(raw)
          ? raw.map(i => i?.interest_name ?? i?.name ?? i).filter(Boolean)
          : [];
        setAllInterests(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)));
      } catch { setAllInterests([]); }
    };
    fetchInterests();
  }, [id]);

  useEffect(() => {
    const availabilityParam = search.get('availability');
    if (availabilityParam) {
      try { setSelectedAvailability(JSON.parse(availabilityParam)); } catch {}
    }
  }, [search]);

  useEffect(() => {
    if (selectedAvailability && selectedAvailability.length > 0 && allUserNames.length > 0) {
      handleAvailabilityFilter();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAvailability, allUserNames]);

  const flash = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 2500); };

  const handleQuickAddFriend = async (user) => {
    try {
      await handleAddTrueFriend(Number(id), Number(user.id));
      flash(`Friend request sent to ${user.firstName} ${user.lastName}`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Could not send request';
      flash(`Could not add friend: ${msg}`);
    }
  };

  const calculateCompatibilityScore = (profile) => {
    if (!currentUser || !profile) return 0;
    const g = 6 * (profile.gender === currentUser.gender ? 1 : 0);
    const p = 5 * (profile.profession === currentUser.profession ? 1 : 0);
    const iA = (profile.Interests || []).map(i => i.interest_name || i);
    const iB = (currentUser.Interests || []).map(i => i.interest_name || i);
    const shared = iA.filter(n => iB.includes(n));
    const ageDiff = -0.3 * Math.abs((profile.age || 0) - (currentUser.age || 0));
    return parseFloat((g + p + 2 * shared.length + ageDiff).toFixed(2));
  };

  const sortByCompatibility = () => {
    const scored = userNames.map((u) => ({ ...u, score: calculateCompatibilityScore(u) }));
    setUserNames(scored.sort((a, b) => b.score - a.score));
  };

  const applyFilters = () => {
    let base = allUserNames;
    const q = (filterInput || '').trim().toLowerCase();
    if (q) {
      base = base.filter(u =>
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    if (selectedMbti.length) {
      const s = new Set(selectedMbti.map(v => v.toUpperCase()));
      base = base.filter(u => s.has(String(u.mbti || '').toUpperCase()));
    }
    if (selectedZodiac.length) {
      const s = new Set(selectedZodiac.map(v => v.toLowerCase()));
      base = base.filter(u => s.has(String(u.zodiac || '').toLowerCase()));
    }
    if (selectedInterests.length) {
      const wanted = new Set(selectedInterests.map(v => v.toLowerCase()));
      base = base.filter(u => {
        const names = [];
        if (Array.isArray(u.Interests)) {
          for (const it of u.Interests) {
            const n = (it?.interest_name ?? it)?.toString().toLowerCase();
            if (n) names.push(n);
          }
        }
        [u.interests, u.interest, u.hobby].filter(Boolean)
          .flatMap(v => Array.isArray(v) ? v : [v])
          .forEach(v => names.push(String(v).toLowerCase()));
        return names.some(s => wanted.has(s));
      });
    }
    setUserNames(base);
  };

  const clearAll = () => {
    setFilterInput('');
    setSelectedMbti([]);
    setSelectedZodiac([]);
    setSelectedInterests([]);
    setSelectedAvailability(null);
    setUserNames(allUserNames);
  };

  const handleAvailabilityFilter = () => {
    if (!selectedAvailability || selectedAvailability.length === 0) return;
    try {
      const selectedSlotsUTC = selectedAvailability.map(slot => {
        const convertTo24Hr = (timeStr) => {
          const dt = DateTime.fromFormat(timeStr.trim(), "h a", { zone: currentUser?.default_time_zone || "UTC" });
          return dt.isValid ? dt.toFormat("HH:mm") : null;
        };
        const start = convertTo24Hr(slot.time);
        const end = DateTime.fromFormat(start, "HH:mm").plus({ hours: 1 }).toFormat("HH:mm");
        return {
          day_of_week: slot.day,
          start_utc: DateTime.fromISO(`2024-01-01T${start}`, { zone: currentUser?.default_time_zone || "UTC" }).toUTC(),
          end_utc: DateTime.fromISO(`2024-01-01T${end}`, { zone: currentUser?.default_time_zone || "UTC" }).toUTC(),
        };
      });
      const filtered = allUserNames.filter(user => {
        if (!Array.isArray(user.Availability) || user.Availability.length === 0) return false;
        const userZone = user.default_time_zone || "UTC";
        return user.Availability.some(userSlot => {
          const userStartUTC = DateTime.fromISO(`2024-01-01T${userSlot.start_time}`, { zone: userZone }).toUTC();
          const userEndUTC = DateTime.fromISO(`2024-01-01T${userSlot.end_time}`, { zone: userZone }).toUTC();
          return selectedSlotsUTC.some(selSlot =>
            userSlot.day_of_week === selSlot.day_of_week &&
            userStartUTC.toISO() === selSlot.start_utc.toISO() &&
            userEndUTC.toISO() === selSlot.end_utc.toISO()
          );
        });
      });
      setUserNames(filtered);
    } catch {}
  };

  const getField = (user, fields) => {
    for (let f of fields) { if (user[f] != null) return user[f]; }
    return null;
  };

  if (loading) return <div className="fs-page"><Navbar id={id} /><p style={{ textAlign: 'center', marginTop: 60 }}>Loading...</p></div>;
  if (profileBlockedMessage) {
    return (
      <div className="fs-page">
        <Navbar id={id} />
        <p style={{ textAlign: 'center', marginTop: 60, color: '#b45309' }}>{profileBlockedMessage}</p>
      </div>
    );
  }
  if (error) return <div className="fs-page"><Navbar id={id} /><p style={{ textAlign: 'center', marginTop: 60, color: '#dc2626' }}>Error loading users.</p></div>;

  return (
    <div className="fs-page">
      <Navbar id={id} />

      <div className="fs-center">
        <div className="fs-card">
          <h1 className="fs-card-title">Find Friends</h1>
          <p className="fs-card-subtitle">Search and filter to find your perfect language partner</p>

          {/* Search bar */}
          <div className="fs-search-row">
            <input
              className="fs-input"
              type="text"
              placeholder="Search by name or email..."
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
            <button className="fs-btn-primary" onClick={applyFilters}>Search</button>
          </div>

          {/* Filter tabs */}
          <div className="fs-filter-tabs">
            {FILTER_TABS.map((tab, i) => (
              <button
                key={tab}
                className={`fs-filter-tab ${activeFilter === i ? 'fs-filter-tab-active' : ''}`}
                onClick={() => setActiveFilter(activeFilter === i ? -1 : i)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* MBTI / Zodiac panel */}
          {activeFilter === 1 && (
            <div className="fs-filter-panel">
              <div className="fs-filter-row">
                <div>
                  <div className="fs-filter-label">MBTI</div>
                  <Select isMulti options={MBTI_OPTIONS}
                    value={MBTI_OPTIONS.filter(o => selectedMbti.includes(o.value))}
                    onChange={(vals) => setSelectedMbti((vals || []).map(v => v.value))}
                    placeholder="Select..." styles={selectStyles} />
                </div>
                <div>
                  <div className="fs-filter-label">Zodiac</div>
                  <Select isMulti options={ZODIAC_OPTIONS}
                    value={ZODIAC_OPTIONS.filter(o => selectedZodiac.includes(o.value))}
                    onChange={(vals) => setSelectedZodiac((vals || []).map(v => v.value))}
                    placeholder="Select..." styles={selectStyles} />
                </div>
              </div>
              <div className="fs-filter-actions">
                <button className="fs-btn-secondary" onClick={clearAll}>Clear</button>
                <button className="fs-btn-primary" onClick={applyFilters}>Apply</button>
              </div>
            </div>
          )}

          {/* Interests panel */}
          {activeFilter === 2 && (
            <div className="fs-filter-panel">
              <div className="fs-filter-label">Interests</div>
              <Select isMulti
                options={allInterests.map(n => ({ value: n, label: n }))}
                value={allInterests.map(n => ({ value: n, label: n })).filter(o => selectedInterests.includes(o.value))}
                onChange={(vals) => setSelectedInterests((vals || []).map(v => v.value))}
                placeholder="Select interests..." styles={selectStyles} />
              <div className="fs-filter-actions">
                <button className="fs-btn-secondary" onClick={() => { setSelectedInterests([]); setUserNames(allUserNames); }}>Clear</button>
                <button className="fs-btn-primary" onClick={applyFilters}>Apply</button>
              </div>
            </div>
          )}

          {/* Availability panel */}
          {activeFilter === 3 && (
            <div className="fs-filter-panel">
              <button className="fs-btn-primary" style={{ width: '100%' }}
                onClick={() => navigate({ pathname: '/AvailabilityPicker', search: createSearchParams({ id }).toString() })}>
                Pick Availability Times
              </button>
              {selectedAvailability && selectedAvailability.length > 0 && (
                <>
                  <div className="fs-avail-display">
                    {selectedAvailability.map((slot, i) => (
                      <span key={i} className="fs-avail-slot">{slot.day} {slot.time}</span>
                    ))}
                  </div>
                  <button className="fs-btn-secondary" style={{ width: '100%' }}
                    onClick={() => { setSelectedAvailability(null); setUserNames(allUserNames); }}>
                    Clear Availability
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Results card */}
        <div className="fs-card">
          <div className="fs-results-header">
            <span className="fs-results-count">{userNames.length} user{userNames.length !== 1 ? 's' : ''} found</span>
            <button className="fs-btn-secondary" onClick={sortByCompatibility}>Sort by Compatibility</button>
          </div>

          {userNames.length === 0 ? (
            <p className="fs-empty">No users match your filters.</p>
          ) : (
            <div className="fs-results-list">
              {userNames.map((user, i) => (
                <div key={i} className="fs-user-row">
                  <div className="fs-avatar">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
                  </div>

                  <div className="fs-user-info">
                    <div className="fs-user-name">{user.firstName} {user.lastName}</div>
                    <div className="fs-user-meta">
                      {user.profession && <span>{user.profession}</span>}
                      {user.age && <span>Age {user.age}</span>}
                      {getField(user, ["nativeLanguage", "native_language"]) && (
                        <span>{getField(user, ["nativeLanguage", "native_language"])} → {getField(user, ["targetLanguage", "target_language"])}</span>
                      )}
                    </div>
                  </div>

                  <div className="fs-user-tags">
                    {user.mbti && <span className="fs-tag">{user.mbti}</span>}
                    {user.zodiac && <span className="fs-tag">{user.zodiac}</span>}
                  </div>

                  {user.score !== null && user.score !== undefined && (
                    <span className="fs-score-pill">{user.score}</span>
                  )}

                  <button className="fs-add-btn" title="Add friend"
                    onClick={(e) => { e.stopPropagation(); handleQuickAddFriend(user); }}>
                    <FiUserPlus size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {successMessage && <div className="fs-toast">{successMessage}</div>}
    </div>
  );
};

export default FriendSearch;
