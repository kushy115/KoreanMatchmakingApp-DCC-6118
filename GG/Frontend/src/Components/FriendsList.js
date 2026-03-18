import React, { useEffect, useState } from 'react';
import './FriendsList.css';
import { useNavigate, createSearchParams, useSearchParams } from "react-router-dom";
import {
  handleGetTrueFriendsList,
  handleRemoveTrueFriend,
  handleGetFriendRequests,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
} from '../Services/userService';
import Navbar from './NavBar';

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const id = search.get("id");

  const loadAll = async () => {
    if (!id) return;
    try {
      const [friendsPayload, requestsPayload] = await Promise.all([
        handleGetTrueFriendsList(id),
        handleGetFriendRequests(id),
      ]);
      setFriends(Array.isArray(friendsPayload?.friendsList) ? friendsPayload.friendsList : []);
      setIncomingRequests(Array.isArray(requestsPayload?.incoming) ? requestsPayload.incoming : []);
      setOutgoingRequests(Array.isArray(requestsPayload?.outgoing) ? requestsPayload.outgoing : []);
    } catch (err) {
      console.error('Failed to fetch friends/requests:', err);
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    }
  };

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const onAcceptRequest = async (requestId) => {
    try {
      await handleAcceptFriendRequest(requestId, Number(id));
      await loadAll();
    } catch (err) {
      console.error('acceptFriendRequest failed:', err);
    }
  };

  const onRejectRequest = async (requestId) => {
    try {
      await handleRejectFriendRequest(requestId, Number(id));
      await loadAll();
    } catch (err) {
      console.error('rejectFriendRequest failed:', err);
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
          <p className="fl-subtitle">Manage your friends and requests</p>

          <h3 className="fl-section-title">Incoming Requests</h3>
          {incomingRequests.length === 0 ? (
            <p className="fl-empty">No incoming friend requests.</p>
          ) : (
            <div className="fl-list">
              {incomingRequests.map((request) => (
                <div key={request.id} className="fl-friend-row" style={{ cursor: 'default' }}>
                  <div className="fl-avatar">
                    {(request.requesterFirstName || '?')[0].toUpperCase()}
                  </div>
                  <span className="fl-name">
                    {request.requesterFirstName} {request.requesterLastName}
                  </span>
                  <button
                    className="fl-back-btn"
                    style={{ marginRight: 8, width: 90, height: 34 }}
                    onClick={() => onAcceptRequest(request.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="fl-back-btn"
                    style={{ width: 90, height: 34, background: '#f87171', color: 'white' }}
                    onClick={() => onRejectRequest(request.id)}
                  >
                    Reject
                  </button>
                </div>
              ))}
            </div>
          )}

          <h3 className="fl-section-title" style={{ marginTop: 16 }}>Outgoing Requests</h3>
          {outgoingRequests.length === 0 ? (
            <p className="fl-empty">No pending outgoing requests.</p>
          ) : (
            <div className="fl-list">
              {outgoingRequests.map((request) => (
                <div key={request.id} className="fl-friend-row" style={{ cursor: 'default' }}>
                  <div className="fl-avatar">
                    {(request.recipientFirstName || '?')[0].toUpperCase()}
                  </div>
                  <span className="fl-name">
                    {request.recipientFirstName} {request.recipientLastName}
                  </span>
                  <span className="fl-remove-icon" style={{ color: '#f59e0b' }}>Pending</span>
                </div>
              ))}
            </div>
          )}

          <h3 className="fl-section-title" style={{ marginTop: 16 }}>Friends</h3>
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
