
import { useState } from 'react';
import React from "react";
import './Login.scss';
import { handleRegisterApi } from '../Services/userService';
import { createSearchParams, useNavigate } from "react-router-dom";
 
function Registration() {
  let data;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
 
  const handleFirstName = (e) => { setFirstName(e.target.value); setSubmitted(false); };
  const handleLastName  = (e) => { setLastName(e.target.value);  setSubmitted(false); };
  const handleEmail     = (e) => { setEmail(e.target.value);     setSubmitted(false); };
  const handlePassword  = (e) => { setPassword(e.target.value);  setSubmitted(false); };
 
  const handleBack = () => { navigate({ pathname: "/login" }); };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (firstName === '' || lastName === '' || email === '' || password === '') {
      setError(true);
      setErrMsg("Enter all the fields");
      return;
    }
    setError(false);
    setErrMsg("");
    try {
      console.log('Sending Register:', firstName, lastName, email, password);
      let data = await handleRegisterApi(firstName, lastName, email, password);
      console.log('Register response:', data);
 
      if (data && data.errCode !== 0) {
        // Fixed: was checking data.errorCode (typo), now matches API response field errCode
        setSubmitted(true);
        setError(true);
        setErrMsg(data.message);
      }
      if (data && data.errCode === 0) {
        navigate({
          pathname: "/CreateProfile",
          search: createSearchParams({ id: data.id }).toString()
        });
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setErrMsg(error.response.data.message);
      }
    }
  };
 
  const errorMessage = () => (
    <div className="error" style={{ display: error ? '' : 'none' }}>
      <h1>{errMsg}</h1>
    </div>
  );
 
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Sign up to start games, quests, and practice sessions.</p>

        <div>{errorMessage()}</div>

        <form onSubmit={handleSubmit}>
          <div className="login-input">
            <label className="button-header">First Name</label>
            <input placeholder="Enter first name" onChange={handleFirstName} value={firstName} type="text" />
          </div>
          <div className="login-input">
            <label className="button-header">Last Name</label>
            <input placeholder="Enter last name"  onChange={handleLastName}  value={lastName}  type="text" />
          </div>
          <div className="login-input">
            <label className="button-header">Email</label>
            <input placeholder="Enter email"     onChange={handleEmail}     value={email}     type="text" />
          </div>
          <div className="login-input">
            <label className="button-header">Password</label>
            <input placeholder="Enter password"  onChange={handlePassword}  value={password}  type="password" />
          </div>

          <div className="auth-actions">
            <button className="auth-primary" type="submit">Create Profile</button>
            <button className="auth-secondary" type="button" onClick={handleBack}>
              Already have an account? Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
export default Registration;