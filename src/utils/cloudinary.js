import { Cloudinary as CloudinaryCore } from 'cloudinary-core';

// Cloudinary yapılandırması
export const cloudinary = new CloudinaryCore({
  cloud_name: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.REACT_APP_CLOUDINARY_API_KEY,
  api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET,
  secure: true
});

// Profil fotoğrafı yükleme fonksiyonu
export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'wolvesdao');
  formData.append('cloud_name', process.env.REACT_APP_CLOUDINARY_CLOUD_NAME);

  console.log('Uploading to Cloudinary with:', {
    cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
    uploadPreset: 'wolvesdao'
  });

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dym3ff6hs/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error:', errorData);
      throw new Error(`Image upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Upload successful:', data);
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
