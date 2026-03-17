// uploadService.js
// Place in: GG/Frontend/src/Services/uploadService.js

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

// Upload profile image
// file: File object from input[type="file"]
export const handleUploadProfileImageApi = async (userId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('userId', userId);

  const response = await fetch(`${BASE_URL}/api/upload/profile`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type — browser sets it automatically with boundary for multipart
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Upload failed');
  }
  return response.json();
};

// Remove profile image
export const handleRemoveProfileImageApi = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/upload/profile`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to remove image');
  }
  return response.json();
};

// Upload team image (owner only)
export const handleUploadTeamImageApi = async (userId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('userId', userId);

  const response = await fetch(`${BASE_URL}/api/upload/team`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Upload failed');
  }
  return response.json();
};

// Remove team image (owner only)
export const handleRemoveTeamImageApi = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/upload/team`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to remove image');
  }
  return response.json();
};

// Helper — builds full image URL from stored path
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}${imagePath}`;
};
