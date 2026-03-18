import { useState, useEffect } from 'react';
import React from "react";
import './Dashboard.css';
import { createSearchParams, useSearchParams, useNavigate } from "react-router-dom";
import { handleUserDashBoardApi } from '../Services/dashboardService';
import { setUserData } from '../Utils/userData';
import Navbar from './NavBar';

const CARDS = [
  { label: 'Edit Profile',    path: '/UpdateProfile' },
  { label: 'Find Friends',    path: '/FriendSearch' },
  { label: 'Friends List',    path: '/FriendsList' },
  { label: 'Call',            path: '/Videocall' },
  { label: 'Translator',      path: '/Translator' },
  { label: 'User Report',     path: '/UserReport' },
  { label: 'Scheduler',       path: '/Scheduler' },
  { label: 'Chat Assistant',  path: '/Assistant' },
  { label: 'Transcripts',     path: '/TranscriptView' },
  { label: 'Games',           path: '/GameSelection' },
  { label: 'Challenges',      path: '/Challenges' },
  { label: 'Teams',           path: '/TeamLobby' },
];

function Dashboard() {
  const [search] = useSearchParams();
  const id = search.get("id");
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await handleUserDashBoardApi(id);
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);
        setUserData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
        });
      } catch (err) {
        console.log(err);
      }
    };
    load();
  }, [id]);

  const goTo = (path) => {
    navigate({ pathname: path, search: createSearchParams({ id }).toString() });
  };

  return (
    <div className="dashboard-page">
      <Navbar id={id} />

      <div className="dashboard-welcome">
        <h1>Welcome, {firstName} {lastName}</h1>
        <p>What would you like to do today?</p>
      </div>

      <div className="dashboard-grid">
        {CARDS.map((card) => (
          <div key={card.path} className="dash-card" onClick={() => goTo(card.path)}>
            <span className="dash-card-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-footer">
        <button
          className="dash-logout-btn"
          onClick={() => goTo('/LogoutConfirmation')}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
