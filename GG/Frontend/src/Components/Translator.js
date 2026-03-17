import React, { useState } from "react";
import { createSearchParams, useSearchParams, useNavigate } from "react-router-dom";
import translate from "translate";
import { handleTranslator } from "../Services/userService";
import Navbar from './NavBar';
import "./Translator.css";

function Translator() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const id = search.get("id");

  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  const translateButton = async () => {
    try {
      const text = await translate(inputText, { to: "ko", from: "en" });
      setTranslatedText(text);
    } catch (err) {
      console.error("Translation error:", err);
    }
  };

  const onClear = () => {
    setInputText("");
    setTranslatedText("");
  };

  const handleBack = () => {
    navigate({ pathname: "/Dashboard", search: createSearchParams({ id }).toString() });
  };

  return (
    <div className="tl-page">
      <Navbar id={id} />
      <div className="tl-center">
        <div className="tl-card">
          <h1 className="tl-title">Translator</h1>

          <div className="tl-panel">
            <div className="tl-column">
              <span className="tl-label">English</span>
              <textarea
                className="tl-box"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type text here..."
              />
            </div>
            <div className="tl-column">
              <span className="tl-label">Korean</span>
              <textarea
                className="tl-box"
                value={translatedText}
                readOnly
                placeholder="Translation will appear here..."
              />
            </div>
          </div>

          <div className="tl-controls">
            <button className="tl-btn-primary" onClick={translateButton}>Translate</button>
            <button className="tl-btn-secondary" onClick={onClear}>Clear</button>
            <button className="tl-btn-secondary" onClick={handleBack}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Translator;
