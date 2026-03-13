
import React from 'react';
import { useNavigate, createSearchParams, useLocation } from 'react-router-dom';
import './NavBar.css';

function Navbar({ id }) {
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = (pathname) => {
    navigate({
      pathname,
      search: createSearchParams({ id }).toString(),
    });
  };

  // Highlight the active page
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      

      <div className="navbar-links">
        <button className={isActive('/Dashboard')}       onClick={() => goTo('/Dashboard')}>
          🏠 Home
        </button>
        <button className={isActive('/GameSelection')}   onClick={() => goTo('/GameSelection')}>
          🎮 Games
        </button>
        <button className={isActive('/FriendSearch')}    onClick={() => goTo('/FriendSearch')}>
          🔍 Find Friends
        </button>
        <button className={isActive('/FriendsList')}     onClick={() => goTo('/FriendsList')}>
          👥 Friends
        </button>
        <button className={isActive('/Scheduler')}       onClick={() => goTo('/Scheduler')}>
          📅 Scheduler
        </button>
        <button className={isActive('/Assistant')}       onClick={() => goTo('/Assistant')}>
          🤖 AI Chat
        </button>
        <button className={isActive('/TranscriptView')}  onClick={() => goTo('/TranscriptView')}>
          📝 Transcripts
        </button>
        <button className={isActive('/UpdateProfile')}   onClick={() => goTo('/UpdateProfile')}>
          ⚙️ Profile
        </button>
      </div>
      <div className='navbar-translator'>
        <button className={isActive('/Translator')}      onClick={() => goTo('/Translator')}>
          🌐 Translator
        </button>
      </div>

      
    </nav>
  );
}

export default Navbar;