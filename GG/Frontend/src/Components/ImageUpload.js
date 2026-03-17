// ImageUpload.js
// Place in: GG/Frontend/src/Components/ImageUpload/ImageUpload.js
//
// Reusable image upload component used by both profile and team pages.
//
// Props:
//   currentImage  — existing image URL to show as preview (or null)
//   onUpload      — async fn(file) called when user picks a file; should return { url }
//   onRemove      — async fn() called when user clicks Remove
//   placeholder   — text/emoji shown when no image (e.g. first initial or emoji logo)
//   shape         — 'circle' (profile) or 'square' (team logo)
//   size          — pixel size of the preview (default 80)
//   label         — label shown above the upload area

import React, { useState, useRef } from 'react';
import './ImageUpload.css';

function ImageUpload({
  currentImage  = null,
  onUpload,
  onRemove,
  placeholder   = '?',
  shape         = 'circle',
  size          = 80,
  label         = 'Upload Image',
}) {
  const [preview, setPreview]   = useState(currentImage);
  const [loading, setLoading]   = useState(false);
  const [errMsg, setErrMsg]     = useState('');
  const fileInputRef            = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setErrMsg('');
    setLoading(true);

    try {
      const result = await onUpload(file);
      // Replace local blob URL with the real server URL
      if (result?.profileImage) setPreview(result.profileImage);
      if (result?.teamImage)    setPreview(result.teamImage);
    } catch (err) {
      setErrMsg(err.message || 'Upload failed.');
      setPreview(currentImage); // revert on error
    } finally {
      setLoading(false);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setLoading(true);
    setErrMsg('');
    try {
      await onRemove();
      setPreview(null);
    } catch (err) {
      setErrMsg(err.message || 'Failed to remove image.');
    } finally {
      setLoading(false);
    }
  };

  const borderRadius = shape === 'circle' ? '50%' : '12px';

  return (
    <div className="image-upload-wrapper">
      {label && <span className="image-upload-label">{label}</span>}

      <div className="image-upload-preview-row">
        {/* Preview circle/square */}
        <div
          className="image-upload-preview"
          style={{ width: size, height: size, borderRadius, flexShrink: 0 }}
          onClick={() => !loading && fileInputRef.current.click()}
        >
          {preview ? (
            <img
              src={preview.startsWith('blob:') || preview.startsWith('http')
                ? preview
                : `${process.env.REACT_APP_BACKEND_URL}${preview}`}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius }}
            />
          ) : (
            <span className="image-upload-placeholder">{placeholder}</span>
          )}
          {loading && <div className="image-upload-spinner" />}
          {!loading && (
            <div className="image-upload-overlay">
              <span>📷</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="image-upload-actions">
          <button
            className="image-upload-btn-choose"
            onClick={() => fileInputRef.current.click()}
            disabled={loading}
          >
            {preview ? 'Change' : 'Upload'}
          </button>
          {preview && onRemove && (
            <button
              className="image-upload-btn-remove"
              onClick={handleRemove}
              disabled={loading}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {errMsg && <p className="image-upload-error">{errMsg}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}

export default ImageUpload;
