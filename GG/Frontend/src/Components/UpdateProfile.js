import { useState, useEffect } from 'react';
import React from "react";
import './Registration.css';
import './UpdateProfile.css';
import Select from "react-select";
import ProfileImageSection from './ProfileImageSection';

import {
  handleProfileUpdateAPI,
  handleGetAllInterests,
  handleGetUserInterests,
  handleReplaceUserInterests,
  handleGetUserAvailability,
  handleReplaceUserAvailability
} from '../Services/userService';

import { handleGetUserProfileApi } from '../Services/findFriendsService';
import { handleGetUserStatsApi } from '../Services/gameSelectionService';
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";

function UpdateProfile() {
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [targetLanguageProficiency, setTargetLanguageProficiency] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState('');
  const [mbti, setMBTI] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [defaultTimeZone, setDefaultTimeZone] = useState('');
  const [visibility, setVisibility] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [errMsg, setErrMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // prevents flash of empty form

  const [search] = useSearchParams();
  const id = search.get("id");
  const navigate = useNavigate();

  const NativeLanguage = [{ value: "English", label: "English" }, { value: "Korean", label: "Korean" }];
  const TargetLanguage = [{ value: "English", label: "English" }, { value: "Korean", label: "Korean" }];
  const TargetLanguageProficiency = [
    { value: "Beginner", label: "Beginner" }, { value: "Elementary", label: "Elementary" },
    { value: "Intermediate", label: "Intermediate" }, { value: "Proficient", label: "Proficient" },
    { value: "Fluent", label: "Fluent" },
  ];
  const Gender = [{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }];
  const Profession = [
    { value: "Education", label: "Education" }, { value: "Engineering", label: "Engineering" },
    { value: "Retail", label: "Retail" }, { value: "Finance", label: "Finance" },
    { value: "Law", label: "Law" }, { value: "Medicine", label: "Medicine" },
    { value: "Scientist", label: "Scientist" },
  ];
  const Zodiac = [
    { value: "Aries", label: "Aries" }, { value: "Taurus", label: "Taurus" },
    { value: "Gemini", label: "Gemini" }, { value: "Cancer", label: "Cancer" },
    { value: "Leo", label: "Leo" }, { value: "Virgo", label: "Virgo" },
    { value: "Libra", label: "Libra" }, { value: "Scorpio", label: "Scorpio" },
    { value: "Sagittarius", label: "Sagittarius" }, { value: "Capricorn", label: "Capricorn" },
    { value: "Aquarius", label: "Aquarius" }, { value: "Pisces", label: "Pisces" },
  ];
  const TimeZones = [
    { value: "UTC", label: "UTC" }, { value: "America/New_York", label: "America/New_York" },
    { value: "America/Chicago", label: "America/Chicago" }, { value: "America/Denver", label: "America/Denver" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles" }, { value: "Europe/London", label: "Europe/London" },
    { value: "Europe/Paris", label: "Europe/Paris" }, { value: "Asia/Seoul", label: "Asia/Seoul" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  ];
  const MBTI = [
    { value: "INTJ", label: "INTJ" }, { value: "INTP", label: "INTP" },
    { value: "ENTJ", label: "ENTJ" }, { value: "ENTP", label: "ENTP" },
    { value: "INFJ", label: "INFJ" }, { value: "INFP", label: "INFP" },
    { value: "ENFJ", label: "ENFJ" }, { value: "ENFP", label: "ENFP" },
    { value: "ISTJ", label: "ISTJ" }, { value: "ISFJ", label: "ISFJ" },
    { value: "ESTJ", label: "ESTJ" }, { value: "ESFJ", label: "ESFJ" },
    { value: "ISTP", label: "ISTP" }, { value: "ISFP", label: "ISFP" },
    { value: "ESTP", label: "ESTP" }, { value: "ESFP", label: "ESFP" },
  ];
  const VisibilityOptions = [{ value: "Show", label: "Show" }, { value: "Hide", label: "Hide" }];

  const generateHourlySlots = (day) => {
    const slots = [];
    for (let hour = 8; hour < 21; hour++) {
      const start = String(hour).padStart(2, '0') + ':00';
      const end   = String(hour + 1).padStart(2, '0') + ':00';
      const fmt   = (h) => `${((h + 11) % 12 + 1)}${h >= 12 ? 'pm' : 'am'}`;
      slots.push({ value: { day_of_week: day, start_time: start, end_time: end }, label: `${day} ${fmt(hour)}-${fmt(hour + 1)}` });
    }
    return slots;
  };
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const availabilityOptions = days.flatMap(generateHourlySlots);
  const pickSingle = (options, value) => options.find(o => o.value === value) || null;

  // ── Load ALL existing data in one effect ──
  useEffect(() => {
    if (!id) return;

    const loadAllData = async () => {
      try {
        // Run all fetches in parallel
        const [profileRes, userStatsRes, interestsAllRes, interestsUserRes, availabilityRes] = await Promise.allSettled([
          handleGetUserProfileApi(id),
          handleGetUserStatsApi(id),
          handleGetAllInterests(),
          handleGetUserInterests(id),
          handleGetUserAvailability(id),
        ]);

        // ── Profile fields ──
        if (profileRes.status === 'fulfilled') {
          // Axios interceptor already unwraps response.data, so try multiple structures
          const raw = profileRes.value;
          const profile = raw?.data ?? raw;
          console.log('Profile data received:', profile); // helps debug structure
          if (profile) {
            if (profile.native_language)              setNativeLanguage(profile.native_language);
            if (profile.target_language)              setTargetLanguage(profile.target_language);
            if (profile.target_language_proficiency)  setTargetLanguageProficiency(profile.target_language_proficiency);
            if (profile.age)                          setAge(profile.age);
            if (profile.gender)                       setGender(profile.gender);
            if (profile.profession)                   setProfession(profile.profession);
            if (profile.mbti)                         setMBTI(profile.mbti);
            if (profile.zodiac)                       setZodiac(profile.zodiac);
            if (profile.default_time_zone)            setDefaultTimeZone(profile.default_time_zone);
            if (profile.visibility)                   setVisibility(profile.visibility);
          }
        } else {
          console.log('Profile fetch failed (may not exist yet):', profileRes.reason);
        }

        // ── Profile image from UserAccount ──
        if (userStatsRes.status === 'fulfilled' && userStatsRes.value?.profileImage) {
          setProfileImage(userStatsRes.value.profileImage);
        }

        // ── All available interests (for dropdown options) ──
        if (interestsAllRes.status === 'fulfilled') {
          const raw = interestsAllRes.value;
          const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setAllInterests(arr.map(i => ({ value: i.id, label: i.interest_name })));
        }

        // ── User's selected interests ──
        if (interestsUserRes.status === 'fulfilled') {
          const raw = interestsUserRes.value;
          const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setSelectedInterests(arr.map(i => ({ value: i.id, label: i.interest_name })));
        }

        // ── User's availability ──
        if (availabilityRes.status === 'fulfilled') {
          const raw = availabilityRes.value;
          const slots = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setAvailability(slots.map(s => {
            const match = availabilityOptions.find(o =>
              o.value.day_of_week === s.day_of_week &&
              o.value.start_time === s.start_time &&
              o.value.end_time === s.end_time
            );
            return match || {
              value: { day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time },
              label: `${s.day_of_week} ${s.start_time}-${s.end_time}`
            };
          }));
        }

      } catch (err) {
        console.error('Unexpected error loading profile data:', err);
      } finally {
        setDataLoaded(true);
      }
    };

    loadAllData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg('');
    if (!nativeLanguage || !targetLanguage || !targetLanguageProficiency || !age || !profession) {
      setError(true); return;
    }
    setSubmitted(true); setError(false);
    try {
      await handleProfileUpdateAPI(id, nativeLanguage, targetLanguage, targetLanguageProficiency, age, gender, profession, mbti, zodiac, defaultTimeZone, visibility);
      await handleReplaceUserInterests(id, selectedInterests.map(i => i.value));
      await handleReplaceUserAvailability(id, availability.map(a => a.value));
      navigate({ pathname: "/Dashboard", search: createSearchParams({ id }).toString() });
    } catch (err) {
      setErrMsg(err?.response?.data?.message || "Failed to update profile.");
      console.error(err);
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    navigate({ pathname: "/Dashboard", search: createSearchParams({ id }).toString() });
  };

  if (!dataLoaded) {
    return (
      <div className="set-profile-wrapper">
        <div className="set-profile-card">
          <p style={{ textAlign: 'center', color: '#364659', fontFamily: 'DM Serif Display, serif', fontSize: 20 }}>
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="set-profile-wrapper">
      <div className="set-profile-card">
        <h1>Set Profile</h1>
        <h6>(* indicates required fields)</h6>
        <div className="messages">
          {error    && <div className="error"><h1>enter required fields</h1></div>}
          {submitted && <div className="success"><h1>Updated</h1></div>}
          {errMsg   && <div className="error"><h1>{errMsg}</h1></div>}
        </div>
        <form className="set-profile-form">

          {/* ── Profile Image ── */}
          <div className='form-group'>
            <ProfileImageSection id={id} currentImage={profileImage} onImageChange={(path) => setProfileImage(path)} />
          </div>

          <div className='form-group'>
            <label className="label">Native Language*</label>
            <Select options={NativeLanguage} onChange={s => setNativeLanguage(s?.value ?? '')} value={pickSingle(NativeLanguage, nativeLanguage)} />
          </div>
          <div className='form-group'>
            <label className="label">Target Language*</label>
            <Select options={TargetLanguage} onChange={s => setTargetLanguage(s?.value ?? '')} value={pickSingle(TargetLanguage, targetLanguage)} />
          </div>
          <div className='form-group'>
            <label className="label">Level of Target Language*</label>
            <Select options={TargetLanguageProficiency} onChange={s => setTargetLanguageProficiency(s?.value ?? '')} value={pickSingle(TargetLanguageProficiency, targetLanguageProficiency)} />
          </div>
          <div className='form-group'>
            <label className="label">Age*</label>
            <input placeholder="Enter Age" onChange={e => setAge(e.target.value)} className="input" type="text" value={age} />
          </div>
          <div className='form-group'>
            <label className="label">Gender</label>
            <Select options={Gender} onChange={s => setGender(s?.value ?? '')} value={pickSingle(Gender, gender)} />
          </div>
          <div className='form-group'>
            <label className="label">Profession*</label>
            <Select options={Profession} onChange={s => setProfession(s?.value ?? '')} value={pickSingle(Profession, profession)} />
          </div>
          <div className='form-group'>
            <label className="label">Personality Type</label>
            <Select options={MBTI} onChange={s => setMBTI(s?.value ?? '')} value={pickSingle(MBTI, mbti)} />
          </div>
          <div className='form-group'>
            <label className="label">Zodiac</label>
            <Select options={Zodiac} onChange={s => setZodiac(s?.value ?? '')} value={pickSingle(Zodiac, zodiac)} />
          </div>
          <div className='form-group'>
            <label className="label">Interests</label>
            <Select isMulti options={allInterests} onChange={s => setSelectedInterests(s || [])} value={selectedInterests} />
          </div>
          <div className='form-group'>
            <label className="label">Default Time Zone</label>
            <Select options={TimeZones} onChange={s => setDefaultTimeZone(s?.value ?? '')} value={pickSingle(TimeZones, defaultTimeZone)} />
          </div>
          <div className='form-group'>
            <label className="label">Availability</label>
            <Select isMulti options={availabilityOptions} value={availability} onChange={s => setAvailability(s || [])} />
          </div>
          <div className='form-group'>
            <label className="label">Visibility</label>
            <Select options={VisibilityOptions} onChange={s => setVisibility(s?.value ?? '')} value={pickSingle(VisibilityOptions, visibility)} />
          </div>

          <div className="profile-buttons">
            <button className="btn-back-02" type="button" onClick={handleSubmit}>Update Profile</button>
            <button className="btn-back-02" type="button" onClick={handleBack}>Back</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateProfile;