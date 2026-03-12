
import { useState } from 'react';
import React from "react";
import './Registration.css';
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
    <div className="login-background">
      <div className="visual-section">Welcome Back!</div>
      <div className="login-container">
        <div className="login-content">
          <div className="text-login"><h1>Registration</h1></div>
          <div>{errorMessage()}</div>
          <form>
            <div className="login-content">
              <div>
                <label className="button-header">First Name:</label>
                <input placeholder="Enter First Name.." onChange={handleFirstName} value={firstName} type="text" />
              </div>
              <div>
                <label className="button-header">Last Name:</label>
                <input placeholder="Enter Last Name.."  onChange={handleLastName}  value={lastName}  type="text" />
              </div>
              <div>
                <label className="button-header">Email:</label>
                <input placeholder="Enter Email.."     onChange={handleEmail}     value={email}     type="text" />
              </div>
              <div>
                <label className="button-header">Password:</label>
                <input placeholder="Enter Password.."  onChange={handlePassword}  value={password}  type="text" />
              </div>
              <button className="btn-login" onClick={handleSubmit}>Create Profile</button>
              <div
                className="login"
                style={{ color: "black", cursor: "pointer", fontWeight: "normal", transition: "color 0.3s ease" }}
                onClick={handleBack}
                onMouseEnter={(e) => (e.target.style.color = "#6344A6")}
                onMouseLeave={(e) => (e.target.style.color = "black")}
              >
                Already have an account? Login!
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
 
export default Registration;