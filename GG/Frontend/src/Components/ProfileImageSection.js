

import React, { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import {
  handleUploadProfileImageApi,
  handleRemoveProfileImageApi,
  getImageUrl,
} from '../Services/uploadImageService';

function ProfileImageSection({ id, currentImage, onImageChange }) {
  const [imageUrl, setImageUrl] = useState(getImageUrl(currentImage));

  useEffect(() => {
    setImageUrl(getImageUrl(currentImage));
  }, [currentImage]);

  const handleUpload = async (file) => {
    const result = await handleUploadProfileImageApi(id, file);
    const newUrl = getImageUrl(result.profileImage);
    setImageUrl(newUrl);
    if (onImageChange) onImageChange(result.profileImage);
    return result;
  };

  const handleRemove = async () => {
    await handleRemoveProfileImageApi(id);
    setImageUrl(null);
    if (onImageChange) onImageChange(null);
  };

  return (
    <ImageUpload
      currentImage={imageUrl}
      onUpload={handleUpload}
      onRemove={handleRemove}
      placeholder="👤"
      shape="circle"
      size={90}
      label="Profile Picture"
    />
  );
}

export default ProfileImageSection;
