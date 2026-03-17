import React, { useEffect, useState } from 'react';
import './FriendsList.css';
import { useNavigate, createSearchParams, useSearchParams } from "react-router-dom";
import { handleGetTrueFriendsList, handleRemoveTrueFriend } from '../Services/userService';
import Navbar from './NavBar';

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const id = search.get("id");

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const payload = await handleGetTrueFriendsList(id);
        setFriends(Array.isArray(payload?.friendsList) ? payload.friendsList : []);
      } catch (err) {
        console.error('Failed to fetch friends:', err);
        setFriends([]);
      }
    };
    if (id) fetchFriends();
  }, [id]);

  const onRemoveFriend = async (friend) => {
    const currentUserId = Number(id);
    const targetUserId = Number(friend.id);
    setFriends(prev => prev.filter(f => f.id !== targetUserId));
    try {
      await handleRemoveTrueFriend(currentUserId, targetUserId);
    } catch (err) {
      console.error('removeTrueFriend failed:', err);
    }
  };

  const handleBack = () => {
    navigate({ pathname: "/Dashboard", search: createSearchParams({ id }).toString() });
  };

  return (
    <div className="fl-page">
      <Navbar id={id} />
      <div className="fl-center">
        <div className="fl-card">
          <h2 className="fl-title">Friends List</h2>
          <p className="fl-subtitle">Click a friend to remove them</p>

          {friends.length === 0 ? (
            <p className="fl-empty">No friends added yet.</p>
          ) : (
            <div className="fl-list">
              {friends.map(friend => (
                <div key={friend.id} className="fl-friend-row" onClick={() => onRemoveFriend(friend)}>
                  <div className="fl-avatar">
                    {(friend.firstName || '?')[0].toUpperCase()}
                  </div>
                  <span className="fl-name">{friend.firstName} {friend.lastName}</span>
                  <span className="fl-remove-icon">&times;</span>
                </div>
              ))}
            </div>
          )}

          <button className="fl-back-btn" onClick={handleBack}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default FriendsList;
