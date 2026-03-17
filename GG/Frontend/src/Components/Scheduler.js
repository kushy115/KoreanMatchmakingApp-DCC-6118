import React, { useEffect, useState } from 'react';
import './Scheduler.css';
import { useNavigate, createSearchParams, useSearchParams } from "react-router-dom";
import Navbar from './NavBar';

import { 
  handleGetTrueFriendsList, 
  handleCreateMeeting, 
  handleGetTrueUserAvailability,
  handleGetMeetings,
  handleDeleteMeeting      
} from '../Services/userService';

const Scheduler = () => {
  const [friends, setFriends] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const navigate = useNavigate();
  const [search] = useSearchParams();
  const id = search.get("id");

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const getFriendName = (userId) => {
    const friend = friends.find(f => f.id === userId);
    if (!friend) return "Unknown User";
    return `${friend.firstName} ${friend.lastName}`;
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const payload = await handleGetTrueFriendsList(id);
        setFriends(Array.isArray(payload?.friendsList) ? payload.friendsList : []);
      } catch (err) {
        console.error("Failed to fetch friends:", err);
        setFriends([]);
      }
    };

    if (id) fetchFriends();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    handleGetMeetings(id)
      .then(res => {
        const list = res?.data || res;
        setMeetings(Array.isArray(list) ? list : []);
      })
      .catch(err => console.error("Failed to fetch meetings:", err));
  }, [id]);

  const handleBack = () => {
    navigate({
      pathname: "/Dashboard",
      search: createSearchParams({ id }).toString(),
    });
  };

  const handleFriendClick = async (friend) => {
    setSelectedFriend(friend);
    setSelectedSlot("");
    setAvailableSlots([]);

    try {
      const data = await handleGetTrueUserAvailability(friend.id);
      const slots =
        data?.availability ||
        data?.slots ||
        (Array.isArray(data) ? data : []);

      setAvailableSlots(Array.isArray(slots) ? slots : []);
    } catch (err) {
      console.error("Failed to load availability:", err);
      setAvailableSlots([]);
    }
  };

  const handleSchedule = () => {
    if (!selectedFriend || !selectedSlot) return;

    const slot = availableSlots.find(s => String(s.id) === String(selectedSlot));
    if (!slot) return;

    const startRaw =
      slot.start_time || slot.startTime || slot.start || slot.from;

    const endRaw =
      slot.end_time || slot.endTime || slot.end || slot.to;

    const dayOfWeek =
      slot.day_of_week ||
      new Date(startRaw).toLocaleDateString(undefined, { weekday: "short" });

    handleCreateMeeting(id, selectedFriend.id, dayOfWeek, startRaw, endRaw)
      .then(() => {
        alert(`Meeting scheduled with ${selectedFriend.firstName}!`);
        return handleGetMeetings(id);
      })
      .then((res) => {
        const list = res?.data || res;
        setMeetings(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error("Meeting creation failed:", err));
  };

  const handleCancelMeeting = async (meeting) => {
    try {
      const currentUserId = Number(id);
      const otherUserId =
        meeting.user1_id === currentUserId ? meeting.user2_id : meeting.user1_id;

      const ok = window.confirm(
        `Cancel meeting with ${getFriendName(otherUserId)} on ${
          meeting.day_of_week
        } at ${meeting.start_time}?`
      );
      if (!ok) return;

      await handleDeleteMeeting(
        meeting.user1_id,
        meeting.user2_id,
        meeting.day_of_week,
        meeting.start_time,
        meeting.end_time
      );

      setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
    } catch (err) {
      console.error('Failed to delete meeting:', err.response?.data || err.message);
      alert('Failed to delete meeting. Check console for details.');
    }
  };

  return (
    <div className="sched-page">
      <Navbar id={id} />

      <div className="sched-center">
        {/* Meetings card */}
        <div className="sched-card">
          <h2 className="sched-card-title">Scheduled Meetings</h2>
          {meetings.length > 0 && (
            <p className="sched-subtitle">Click a meeting to cancel it</p>
          )}
          {meetings.length === 0 ? (
            <p className="sched-empty">No meetings scheduled.</p>
          ) : (
            <ul className="sched-meeting-list">
              {meetings.map((m) => {
                const otherUser =
                  m.user1_id === Number(id) ? m.user2_id : m.user1_id;

                return (
                  <li
                    key={m.id}
                    className="sched-meeting-item"
                    onClick={() => handleCancelMeeting(m)}
                  >
                    <strong>With:</strong> {getFriendName(otherUser)}<br />
                    <strong>Day:</strong> {m.day_of_week}<br />
                    <strong>Time:</strong> {m.start_time} &ndash; {m.end_time}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Friends card */}
        <div className="sched-card">
          <h2 className="sched-card-title">Friends</h2>
          <p className="sched-subtitle">Select a friend to schedule a meeting</p>

          {friends.length === 0 ? (
            <p className="sched-empty">No friends added yet.</p>
          ) : (
            <div className="sched-friends-list">
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className="sched-friend-chip"
                  onClick={() => handleFriendClick(friend)}
                >
                  {friend.firstName} {friend.lastName}
                </div>
              ))}
            </div>
          )}

          {selectedFriend && (
            <div className="sched-panel">
              <h3>
                Schedule with {selectedFriend.firstName} {selectedFriend.lastName}
              </h3>

              {availableSlots.length === 0 ? (
                <p className="sched-no-slots">No available time slots.</p>
              ) : (
                <>
                  <label className="sched-dropdown-label">
                    Choose a time:
                    <select
                      className="sched-select"
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                    >
                      <option value="">...</option>
                      {availableSlots.map(slot => {
                        const startRaw =
                          slot.start_time || slot.startTime || slot.start || slot.from;
                        const endRaw =
                          slot.end_time || slot.endTime || slot.end || slot.to;

                        const startDate = new Date(startRaw);
                        const endDate = new Date(endRaw);

                        if (isNaN(startDate.getTime())) {
                          return (
                            <option key={slot.id} value={slot.id}>
                              {slot.day_of_week ?? "??"} -- {String(startRaw)} - {String(endRaw)}
                            </option>
                          );
                        }

                        const weekday = slot.day_of_week ||
                          startDate.toLocaleDateString(undefined, { weekday: "short" });
                        const startLabel = startDate.toLocaleTimeString(undefined, {
                          hour: "numeric", minute: "2-digit",
                        });
                        const endLabel = endDate.toLocaleTimeString(undefined, {
                          hour: "numeric", minute: "2-digit",
                        });

                        return (
                          <option key={slot.id} value={slot.id}>
                            {weekday} -- {startLabel} to {endLabel}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <button
                    className="sched-confirm-btn"
                    disabled={!selectedSlot}
                    onClick={handleSchedule}
                  >
                    Confirm Meeting
                  </button>
                </>
              )}
            </div>
          )}

          <button className="sched-back-btn" onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Scheduler;
