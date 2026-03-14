 
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, createSearchParams, useLocation } from 'react-router-dom';
import './NavBar.css';
 
const NAV_LINKS = [
  { label: '🏠 Home',         path: '/Dashboard' },
  { label: '🎮 Games',        path: '/GameSelection' },
  { label: '🔍 Find Friends', path: '/FriendSearch' },
  { label: '👥 Friends',      path: '/FriendsList' },
  { label: '🤝 Teams',        path: '/TeamPage' },
  { label: '📅 Scheduler',    path: '/Scheduler' },
  { label: '🤖 AI Chat',      path: '/Assistant' },
  { label: '📝 Transcripts',  path: '/TranscriptView' },
  { label: '⚙️ Profile',      path: '/UpdateProfile' },
];
 
// Width reserved for hamburger button when it appears
const HAMBURGER_WIDTH = 48;
 
function Navbar({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
 
  const [menuOpen, setMenuOpen]         = useState(false);
  const [visibleCount, setVisibleCount] = useState(NAV_LINKS.length);
 
  const navbarRef  = useRef(null);
  const rightRef   = useRef(null);
  const buttonRefs = useRef([]);
 
  const goTo = (pathname) => {
    setMenuOpen(false);
    navigate({ pathname, search: createSearchParams({ id }).toString() });
  };
 
  const isActive = (path) =>
    location.pathname === path ? 'nav-link active' : 'nav-link';
 
  const calculate = useCallback(() => {
    const navbar = navbarRef.current;
    const right  = rightRef.current;
    if (!navbar || !right) return;
 
    // Measure actual space the links container has available
    // by using the navbar's inner width minus the right panel's full width
    const navbarInner = navbar.getBoundingClientRect().width; 
    const rightWidth  = right.getBoundingClientRect().width;  
 
    let available = navbarInner - rightWidth;
 
    // First pass: do all buttons fit without a hamburger?
    let total = 0;
    let count = 0;
    for (let i = 0; i < buttonRefs.current.length; i++) {
      const btn = buttonRefs.current[i];
      if (!btn) continue;
      const w = btn.getBoundingClientRect().width + 2; // +2 for gap between buttons
      if (total + w <= available) {
        total += w;
        count++;
      } else {
        break;
      }
    }
 
    // Second pass: if not all fit, reserve hamburger space and recalculate
    if (count < NAV_LINKS.length) {
      available -= HAMBURGER_WIDTH + 8;
      total = 0;
      count = 0;
      for (let i = 0; i < buttonRefs.current.length; i++) {
        const btn = buttonRefs.current[i];
        if (!btn) continue;
        const w = btn.getBoundingClientRect().width + 2;
        if (total + w <= available) {
          total += w;
          count++;
        } else {
          break;
        }
      }
    }
 
    setVisibleCount(count);
  }, []);
 
  useEffect(() => {
    // Wait a frame so buttons are rendered and have widths
    const frame = requestAnimationFrame(calculate);
    const ro = new ResizeObserver(calculate);
    if (navbarRef.current) ro.observe(navbarRef.current);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); };
  }, [calculate]);
 
  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('.hamburger-wrapper')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);
 
  const hiddenLinks = NAV_LINKS.slice(visibleCount);
 
  return (
    <nav className="navbar" ref={navbarRef}>
      <div className="navbar-links">
        {NAV_LINKS.map((link, i) => (
          <button
            key={link.path}
            ref={(el) => (buttonRefs.current[i] = el)}
            className={isActive(link.path)}
            onClick={() => goTo(link.path)}
            style={{
              visibility: i < visibleCount ? 'visible' : 'hidden',
              pointerEvents: i < visibleCount ? 'auto' : 'none',
              // Keep hidden buttons in DOM so we can measure their widths
              position: i < visibleCount ? 'relative' : 'absolute',
              opacity: i < visibleCount ? 1 : 0,
            }}
          >
            {link.label}
          </button>
        ))}
      </div>
 
      <div className="navbar-right" ref={rightRef}>
        {hiddenLinks.length > 0 && (
          <div className="hamburger-wrapper">
            <button
              className={`navbar-hamburger ${menuOpen ? 'hamburger-open' : ''}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
            </button>
 
            {menuOpen && (
              <div className="navbar-dropdown">
                {hiddenLinks.map((link) => (
                  <button
                    key={link.path}
                    className={`dropdown-link ${location.pathname === link.path ? 'dropdown-link-active' : ''}`}
                    onClick={() => goTo(link.path)}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
 
        <button className="nav-translator-btn" onClick={() => goTo('/Translator')}>
          🌐 Translator
        </button>
      </div>
    </nav>
  );
}
 
export default Navbar;