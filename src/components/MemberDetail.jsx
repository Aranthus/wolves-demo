import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Link,
  Chip,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  SvgIcon,
  Tab,
  Tabs,
  Container
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookIcon from '@mui/icons-material/Book';
import ArticleIcon from '@mui/icons-material/Article';
import LinkIcon from '@mui/icons-material/Link';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy,
  serverTimestamp,
  where,
  getDocs,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';

// Custom Discord icon component
const DiscordIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.02.06.03.09.02c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/>
  </SvgIcon>
);

const categories = [
  { id: 'gaming', label: 'Gaming', color: '#FF1493' },
  { id: 'nft', label: 'NFT', color: '#7B68EE' },
  { id: 'token', label: 'Token', color: '#20B2AA' },
  { id: 'memecoin', label: 'Memecoins', color: '#FFD700' },
  { id: 'ai', label: 'AI', color: '#4CAF50' }
];

const categoryOptions = [
  { id: 'gaming', label: 'Gaming' },
  { id: 'nft', label: 'NFT' },
  { id: 'token', label: 'Token' },
  { id: 'memecoins', label: 'Memecoins' },
  { id: 'defi', label: 'DeFi' }
];

const getColorForCategory = (category) => {
  const found = categories.find(c => c.id === category.toLowerCase());
  return found ? found.color : '#64748B';
};

export default function MemberDetail() {
  // 
  const { id: userId } = useParams();
  const { currentUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [contents, setContents] = useState([]);
  const [holdings, setHoldings] = useState([]); 
  const [openNewContent, setOpenNewContent] = useState(false);
  
  const [newContentData, setNewContentData] = useState({
    title: '',
    description: '',
    category: '',
    links: {
      discord: '',
      twitter: '',
      linkedin: [], 
      website: '',
      gitbook: '',
      medium: '',
      additional: []
    }
  });

  const [newHolding, setNewHolding] = useState({
    type: 'token',
    name: '',
    description: '',
    contractAddress: '',
    amount: '',
    chain: ''
  });

  const [editingContent, setEditingContent] = useState(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    description: '',
    photoURL: '',
    categories: [],
    links: {
      twitter: '',
      discord: '',
      additional: []
    }
  });
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [newAdditionalLink, setNewAdditionalLink] = useState('');

  const [isAddingHolding, setIsAddingHolding] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);

  const resetHoldingState = () => {
    setNewHolding({
      type: 'token',
      name: '',
      description: '',
      contractAddress: '',
      amount: '',
      chain: ''
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        // get member data
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // listen constent collection
        const contentsRef = collection(db, 'contents');
        const q = query(contentsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const contentsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().createdAt?.toMillis() || new Date().getTime()
          }));
          setContents(contentsList);
        });

        //
        const holdingsRef = collection(db, 'holdings');
        const holdingsQuery = query(holdingsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        
        const holdingsUnsubscribe = onSnapshot(holdingsQuery, (snapshot) => {
          const holdingsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().createdAt?.toMillis() || new Date().getTime()
          }));
          setHoldings(holdingsList);
        });

        return () => {
          unsubscribe();
          holdingsUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // 
    const userRef = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        // 
        setProfileData({
          displayName: data.displayName || '',
          description: data.description || '',
          photoURL: data.photoURL || '',
          categories: data.categories || [],
          links: {
            twitter: data.links?.twitter || '',
            discord: data.links?.discord || '',
            additional: data.links?.additional || []
          }
        });
      }
    });

    return () => {
      unsubscribeUser();
    };
  }, [userId]);

  const handleContentSubmit = async () => {
    if (!currentUser || !newContentData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      const contentData = {
        ...newContentData,
        userId: userId,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        type: 'content'
      };

      // Add to appropriate collection
      const collectionRef = collection(db, 'contents');
      await addDoc(collectionRef, contentData);

      // Clear form
      setNewContentData({
        title: '',
        description: '',
        category: '',
        links: {
          discord: '',
          twitter: '',
          linkedin: [], 
          website: '',
          gitbook: '',
          medium: '',
          additional: []
        }
      });
      
      // Close dialog
      setOpenNewContent(false);
      
      // Refresh contents
      const contentsQuery = query(
        collection(db, 'contents'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const contentsSnapshot = await getDocs(contentsQuery);
      setContents(contentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error adding content:', error);
      alert('Error adding content: ' + error.message);
    }
  };

  const handleHoldingSubmit = async () => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'holdings'), {
        ...newHolding,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });

      resetHoldingState();
      
      // Refresh holdings
      const holdingsQuery = query(
        collection(db, 'holdings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const holdingsSnapshot = await getDocs(holdingsQuery);
      setHoldings(holdingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error adding holding:', error);
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!currentUser || currentUser.uid !== userId) return;

    try {
      await deleteDoc(doc(db, 'contents', contentId));
      setContents(contents.filter(content => content.id !== contentId));
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleDeleteHolding = async (holdingId) => {
    try {
      await deleteDoc(doc(db, 'holdings', holdingId));
    } catch (error) {
      console.error('Error deleting holding:', error);
      alert('Error deleting holding. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || currentUser.uid !== userId) return;

    try {
      await deleteAccount();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleLinkChange = (type, value, index = null) => {
    setNewContentData(prev => {
      const newLinks = { ...prev.links };
      
      if (Array.isArray(newLinks[type])) {
        if (index !== null) {
          newLinks[type] = newLinks[type].map((link, i) => i === index ? value : link);
        } else {
          newLinks[type] = [...newLinks[type], value];
        }
      } else {
        newLinks[type] = value;
      }
      
      return { ...prev, links: newLinks };
    });
  };

  const handleRemoveLink = (type, index) => {
    setNewContentData(prev => {
      const newLinks = { ...prev.links };
      if (Array.isArray(newLinks[type])) {
        newLinks[type] = newLinks[type].filter((_, i) => i !== index);
      }
      return { ...prev, links: newLinks };
    });
  };

  const handleAddLink = (type) => {
    if (type === 'linkedin') {
      setNewContentData(prev => ({
        ...prev,
        links: {
          ...prev.links,
          linkedin: [...prev.links.linkedin, { name: '', url: '' }]
        }
      }));
    } else if (type === 'additional') {
      setNewContentData(prev => ({
        ...prev,
        links: {
          ...prev.links,
          additional: [...prev.links.additional, '']
        }
      }));
    }
  };

  const handleLinkedInLinkChange = (index, field, value) => {
    setNewContentData(prev => {
      const newLinkedIn = [...prev.links.linkedin];
      newLinkedIn[index] = {
        ...newLinkedIn[index],
        [field]: value
      };
      return {
        ...prev,
        links: {
          ...prev.links,
          linkedin: newLinkedIn
        }
      };
    });
  };

  const handleRemoveLinkedInLink = (index) => {
    setNewContentData(prev => ({
      ...prev,
      links: {
        ...prev.links,
        linkedin: prev.links.linkedin.filter((_, i) => i !== index)
      }
    }));
  };

  const handleEditContent = (content) => {
    setEditingContent(content);
    setNewContentData({
      title: content.title,
      description: content.description,
      category: content.category,
      links: {
        discord: content.links?.discord || '',
        twitter: content.links?.twitter || '',
        linkedin: content.links?.linkedin || [],
        website: content.links?.website || '',
        gitbook: content.links?.gitbook || '',
        medium: content.links?.medium || '',
        additional: content.links?.additional || []
      }
    });
    setOpenNewContent(true);
  };

  const handleSaveContent = async () => {
    try {
      if (editingContent) {
        // Update existing content
        await updateDoc(doc(db, 'contents', editingContent.id), {
          ...newContentData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new content
        await addDoc(collection(db, 'contents'), {
          ...newContentData,
          userId,
          createdAt: serverTimestamp()
        });
      }
      
      setNewContentData({
        title: '',
        description: '',
        category: '',
        links: {
          discord: '',
          twitter: '',
          linkedin: [], 
          website: '',
          gitbook: '',
          medium: '',
          additional: []
        }
      });
      setEditingContent(null);
      setOpenNewContent(false);
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewPhotoFile(file);
    }
  };

  const handleProfileSave = async () => {
    try {
      let photoURL = profileData.photoURL;

      // 
      if (newPhotoFile) {
        try {
          console.log('Uploading new photo:', newPhotoFile);
          const formData = new FormData();
          formData.append('file', newPhotoFile);
          formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
          formData.append('api_key', process.env.REACT_APP_CLOUDINARY_API_KEY);

          console.log('Sending request to Cloudinary...');
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          const data = await response.json();
          console.log('Cloudinary response:', data);

          if (!response.ok) {
            throw new Error(`Cloudinary error: ${data.error?.message || 'Unknown error'}`);
          }

          photoURL = data.secure_url;
          console.log('New photo URL:', photoURL);
        } catch (uploadError) {
          console.error('Error uploading photo:', uploadError);
          alert('Fotoğraf yüklenirken bir hata oluştu: ' + uploadError.message);
          return;
        }
      }

      // 
      const updatedUserData = {
        displayName: profileData.displayName,
        description: profileData.description,
        categories: profileData.categories,
        links: profileData.links,
        updatedAt: serverTimestamp()
      };

      console.log('Current photoURL:', photoURL);
      // 
      if (photoURL) {
        updatedUserData.photoURL = photoURL;
        console.log('Adding photoURL to update:', photoURL);
      }

      console.log('Updating user data:', updatedUserData);
      await updateDoc(doc(db, 'users', userId), updatedUserData);

      // 
      setUserData(prev => {
        const newData = {
          ...prev,
          ...updatedUserData
        };
        console.log('Updated local state:', newData);
        return newData;
      });
      setIsEditingProfile(false);
      setNewPhotoFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Profil güncellenirken bir hata oluştu: ' + error.message);
    }
  };

  const handleAddAdditionalLink = () => {
    if (newAdditionalLink) {
      setProfileData({
        ...profileData,
        links: {
          ...profileData.links,
          additional: [...profileData.links.additional, newAdditionalLink]
        }
      });
      setNewAdditionalLink('');
    }
  };

  const handleRemoveAdditionalLink = (index) => {
    const newAdditionalLinks = [...profileData.links.additional];
    newAdditionalLinks.splice(index, 1);
    setProfileData({
      ...profileData,
      links: {
        ...profileData.links,
        additional: newAdditionalLinks
      }
    });
  };

  const handleAddHolding = async () => {
    try {
      const newHoldingRef = doc(collection(db, 'holdings'));
      await setDoc(newHoldingRef, {
        ...newHolding,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setIsAddingHolding(false);
      resetHoldingState();
    } catch (error) {
      console.error('Error adding holding:', error);
      alert('Error adding holding. Please try again.');
    }
  };

  const handleEditHolding = async () => {
    try {
      if (!editingHolding) return;
      
      await updateDoc(doc(db, 'holdings', editingHolding.id), {
        ...newHolding,
        updatedAt: serverTimestamp()
      });
      
      setEditingHolding(null);
      setIsAddingHolding(false);
      resetHoldingState();
    } catch (error) {
      console.error('Error updating holding:', error);
      alert('Error updating holding. Please try again.');
    }
  };

  const startEditHolding = (holding) => {
    setNewHolding({
      type: holding.type || 'token',
      name: holding.name || '',
      description: holding.description || '',
      contractAddress: holding.contractAddress || '',
      amount: holding.amount || '',
      chain: holding.chain || ''
    });
    setEditingHolding(holding);
    setIsAddingHolding(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const HoldingCard = ({ holding }) => (
    <Box
      sx={{
        background: 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        height: '220px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={(holding.type || 'TOKEN').toUpperCase()} 
            size="small"
            sx={{ 
              backgroundColor: 'rgba(157, 92, 233, 0.2)',
              color: '#fff',
              borderRadius: '8px'
            }} 
          />
          {holding.chain && (
            <Chip 
              label={holding.chain}
              size="small"
              sx={{ 
                backgroundColor: 'rgba(157, 92, 233, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                height: '20px',
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem'
                }
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => startEditHolding(holding)}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#fff', background: 'rgba(157, 92, 233, 0.1)' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDeleteHolding(holding.id)}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
        {holding.name || 'Unnamed Holding'}
      </Typography>

      <Typography 
        variant="body2" 
        sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          mb: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '40px'
        }}
      >
        {holding.description || 'No description'}
      </Typography>

      <Box sx={{ mt: 'auto' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', wordBreak: 'break-all', mb: 1 }}>
          Contract: {holding.contractAddress}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Amount: {holding.amount || '0'}
        </Typography>
      </Box>
    </Box>
  );

  if (!userData) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a0b2e',
      overflowY: 'auto',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <Container maxWidth="xl" sx={{ 
        px: { xs: 2, sm: 3 },
        py: 4,
        height: '100%'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4
        }}>
          <IconButton 
            onClick={() => navigate(-1)}
            sx={{ 
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          {currentUser && (
            <IconButton
              onClick={handleLogout}
              sx={{
                color: '#ff4d4d',
                '&:hover': {
                  bgcolor: 'rgba(255,77,77,0.1)'
                }
              }}
            >
              <LogoutIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ pb: 8 }}>
          {/* User Profile Section */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: 4,
            mb: 6
          }}>
            {/* Left Column - Profile */}
            <Box sx={{ 
              width: 280, 
              flexShrink: 0, 
              position: 'sticky', 
              top: 24, 
              alignSelf: 'flex-start'
            }}>
              <Card sx={{
                background: 'linear-gradient(135deg, rgba(35, 11, 52, 0.7) 0%, rgba(49, 22, 77, 0.7) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                overflow: 'visible',
                position: 'relative'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ position: 'relative', mb: 3, display: 'flex', justifyContent: 'center' }}>
                    <Avatar
                      src={userData.photoURL}
                      sx={{
                        width: 120,
                        height: 120,
                        border: '4px solid rgba(157, 92, 233, 0.3)',
                        boxShadow: '0 4px 20px rgba(157, 92, 233, 0.2)'
                      }}
                    />
                    {currentUser && currentUser.uid === userId && (
                      <IconButton
                        onClick={() => setIsEditingProfile(true)}
                        sx={{
                          position: 'absolute',
                          right: -10,
                          top: -10,
                          bgcolor: 'rgba(157, 92, 233, 0.2)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          '&:hover': {
                            bgcolor: 'rgba(157, 92, 233, 0.3)',
                          }
                        }}
                      >
                        <EditIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    )}
                  </Box>

                  <Typography
                    variant="h4"
                    component="h1"
                    align="center"
                    sx={{
                      color: '#fff',
                      fontWeight: 600,
                      mb: 2,
                      fontSize: '2rem'
                    }}
                  >
                    {userData.displayName}
                  </Typography>

                  {userData.description && (
                    <Typography
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        mb: 3,
                        fontSize: '1rem'
                      }}
                    >
                      {userData.description}
                    </Typography>
                  )}

                  <Stack spacing={2} sx={{ mb: 3 }}>
                    {userData.links?.twitter && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: '#1DA1F2'
                      }}>
                        <TwitterIcon />
                        <Link 
                          href={`https://twitter.com/${userData.links.twitter.replace('https://twitter.com/', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            color: 'inherit',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {userData.links.twitter.replace('https://twitter.com/', '')}
                        </Link>
                      </Box>
                    )}

                    {userData.links?.discord && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: '#5865F2'
                      }}>
                        <DiscordIcon />
                        <Typography sx={{ color: 'inherit' }}>
                          @{userData.links.discord}
                        </Typography>
                      </Box>
                    )}

                    {userData.links?.additional?.map((link, index) => (
                      <Box 
                        key={index}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          color: '#fff'
                        }}
                      >
                        <LinkIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                        <Link 
                          href={link}
                          target="_blank"
                          sx={{ 
                            color: 'inherit',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {link}
                        </Link>
                      </Box>
                    ))}
                  </Stack>

                  {userData.categories?.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {userData.categories.map((category) => (
                        <Chip
                          key={category}
                          label={categoryOptions.find(cat => cat.id === category)?.label}
                          sx={{
                            backgroundColor: 'rgba(157, 92, 233, 0.2)',
                            color: '#fff',
                            border: '1px solid rgba(157, 92, 233, 0.3)',
                            '&:hover': {
                              backgroundColor: 'rgba(157, 92, 233, 0.3)',
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Right Column - Content Tabs */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'rgba(157, 92, 233, 0.2)', 
                mb: 3,
                display: 'flex',
                gap: 2,
                px: 1,
                pb: 1
              }}>
                <Button
                  onClick={() => setActiveTab(0)}
                  sx={{
                    background: activeTab === 0 
                      ? 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))'
                      : 'transparent',
                    color: activeTab === 0 ? '#9D5CE9' : 'rgba(255, 255, 255, 0.5)',
                    border: '1px solid',
                    borderColor: activeTab === 0 ? 'rgba(157, 92, 233, 0.3)' : 'transparent',
                    borderRadius: '20px',
                    px: 3,
                    py: 1,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(145deg, rgba(28, 28, 28, 0.95), rgba(23, 23, 23, 0.85))',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                      borderColor: '#9D5CE9'
                    }
                  }}
                >
                  Contents
                </Button>
                <Button
                  onClick={() => setActiveTab(1)}
                  sx={{
                    background: activeTab === 1 
                      ? 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))'
                      : 'transparent',
                    color: activeTab === 1 ? '#9D5CE9' : 'rgba(255, 255, 255, 0.5)',
                    border: '1px solid',
                    borderColor: activeTab === 1 ? 'rgba(157, 92, 233, 0.3)' : 'transparent',
                    borderRadius: '20px',
                    px: 3,
                    py: 1,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(145deg, rgba(28, 28, 28, 0.95), rgba(23, 23, 23, 0.85))',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                      borderColor: '#9D5CE9'
                    }
                  }}
                >
                  Recent Additions
                </Button>
                <Button
                  onClick={() => setActiveTab(2)}
                  sx={{
                    background: activeTab === 2 
                      ? 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))'
                      : 'transparent',
                    color: activeTab === 2 ? '#9D5CE9' : 'rgba(255, 255, 255, 0.5)',
                    border: '1px solid',
                    borderColor: activeTab === 2 ? 'rgba(157, 92, 233, 0.3)' : 'transparent',
                    borderRadius: '20px',
                    px: 3,
                    py: 1,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(145deg, rgba(28, 28, 28, 0.95), rgba(23, 23, 23, 0.85))',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                      borderColor: '#9D5CE9'
                    }
                  }}
                >
                  Holdings
                </Button>
              </Box>

              {/* Contents Tab */}
              {activeTab === 0 && (
                <Box>
                  {currentUser?.uid === userId && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenNewContent(true)}
                      sx={{
                        background: 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))',
                        color: '#9D5CE9',
                        border: '1px solid rgba(157, 92, 233, 0.3)',
                        borderRadius: '20px',
                        px: 3,
                        py: 1,
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'linear-gradient(145deg, rgba(28, 28, 28, 0.95), rgba(23, 23, 23, 0.85))',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                          borderColor: '#9D5CE9'
                        },
                        mb: 3
                      }}
                    >
                      New Content
                    </Button>
                  )}

                  <Grid container spacing={2}>
                    {contents.map((content, index) => (
                      <Grid item xs={12} key={index}>
                        <Box
                          sx={{
                            background: 'rgba(35, 11, 52, 0.9)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '12px',
                            p: 3,
                            mb: 2,
                            border: '1px solid rgba(157, 92, 233, 0.2)'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" sx={{ 
                              color: '#fff',
                              fontWeight: 600
                            }}>
                              {content.title}
                            </Typography>
                            
                            {currentUser?.uid === userId && (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton 
                                  onClick={() => handleEditContent(content)}
                                  sx={{ 
                                    width: 32,
                                    height: 32,
                                    backgroundColor: 'rgba(157, 92, 233, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(157, 92, 233, 0.2)',
                                    '& svg': {
                                      fontSize: '1.2rem',
                                      color: '#9D5CE9'
                                    },
                                    '&:hover': {
                                      backgroundColor: 'rgba(157, 92, 233, 0.2)',
                                      border: '1px solid rgba(157, 92, 233, 0.3)'
                                    }
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton 
                                  onClick={() => handleDeleteContent(content.id)}
                                  sx={{ 
                                    width: 32,
                                    height: 32,
                                    backgroundColor: 'rgba(255, 23, 68, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 23, 68, 0.2)',
                                    '& svg': {
                                      fontSize: '1.2rem',
                                      color: '#ff1744'
                                    },
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 23, 68, 0.2)',
                                      border: '1px solid rgba(255, 23, 68, 0.3)'
                                    }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                          <Typography sx={{ 
                            color: '#fff',
                            mb: 3,
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6
                          }}>
                            {content.description}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            {content.links?.website && (
                              <Button
                                href={content.links.website}
                                target="_blank"
                                startIcon={<LanguageIcon />}
                                sx={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  color: '#fff',
                                  textTransform: 'none',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#fff'
                                  }
                                }}
                              >
                                Website
                              </Button>
                            )}
                            {content.links?.twitter && (
                              <Button
                                href={content.links.twitter}
                                target="_blank"
                                startIcon={<TwitterIcon />}
                                sx={{
                                  backgroundColor: 'rgba(29, 161, 242, 0.1)',
                                  color: '#1DA1F2',
                                  textTransform: 'none',
                                  border: '1px solid rgba(29, 161, 242, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(29, 161, 242, 0.2)',
                                    border: '1px solid rgba(29, 161, 242, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#1DA1F2'
                                  }
                                }}
                              >
                                Twitter
                              </Button>
                            )}
                            {content.links?.discord && (
                              <Button
                                href={`https://discord.com/users/${content.links.discord}`}
                                target="_blank"
                                startIcon={<DiscordIcon />}
                                sx={{
                                  backgroundColor: 'rgba(88, 101, 242, 0.1)',
                                  color: '#5865F2',
                                  textTransform: 'none',
                                  border: '1px solid rgba(88, 101, 242, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(88, 101, 242, 0.2)',
                                    border: '1px solid rgba(88, 101, 242, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#5865F2'
                                  }
                                }}
                              >
                                Discord
                              </Button>
                            )}
                            {content.links?.gitbook && (
                              <Button
                                href={content.links.gitbook}
                                target="_blank"
                                startIcon={<BookIcon />}
                                sx={{
                                  backgroundColor: 'rgba(56, 132, 255, 0.1)',
                                  color: '#3884FF',
                                  textTransform: 'none',
                                  border: '1px solid rgba(56, 132, 255, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(56, 132, 255, 0.2)',
                                    border: '1px solid rgba(56, 132, 255, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#3884FF'
                                  }
                                }}
                              >
                                GitBook
                              </Button>
                            )}
                            {content.links?.medium && (
                              <Button
                                href={content.links.medium}
                                target="_blank"
                                startIcon={<ArticleIcon />}
                                sx={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  color: '#fff',
                                  textTransform: 'none',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#fff'
                                  }
                                }}
                              >
                                Medium
                              </Button>
                            )}
                            {content.links?.linkedin?.map((link, index) => (
                              <Button
                                key={index}
                                href={link.url}
                                target="_blank"
                                startIcon={<LinkedInIcon />}
                                sx={{
                                  backgroundColor: 'rgba(0, 119, 181, 0.1)',
                                  color: '#0077B5',
                                  textTransform: 'none',
                                  border: '1px solid rgba(0, 119, 181, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0, 119, 181, 0.2)',
                                    border: '1px solid rgba(0, 119, 181, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#0077B5'
                                  }
                                }}
                              >
                                {link.name || 'LinkedIn'}
                              </Button>
                            ))}
                            {content.links?.additional?.map((link, index) => (
                              <Button
                                key={index}
                                href={link}
                                target="_blank"
                                startIcon={<LanguageIcon />}
                                sx={{
                                  backgroundColor: 'rgba(157, 92, 233, 0.1)',
                                  color: '#9D5CE9',
                                  textTransform: 'none',
                                  border: '1px solid rgba(157, 92, 233, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(157, 92, 233, 0.2)',
                                    border: '1px solid rgba(157, 92, 233, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#9D5CE9'
                                  }
                                }}
                              >
                                Link {content.links.additional.length > 1 ? index + 1 : ''}
                              </Button>
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Recent Additions Tab */}
              {activeTab === 1 && (
                <Box>
                  <Grid container spacing={2}>
                    {contents.slice(0, 5).map((content, index) => (
                      <Grid item xs={12} key={index}>
                        <Box
                          sx={{
                            background: 'rgba(35, 11, 52, 0.9)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '12px',
                            p: 3,
                            mb: 2,
                            border: '1px solid rgba(157, 92, 233, 0.2)'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" sx={{ 
                              color: '#fff',
                              fontWeight: 600
                            }}>
                              {content.title}
                            </Typography>
                            
                            {currentUser?.uid === userId && (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton 
                                  onClick={() => handleEditContent(content)}
                                  sx={{ 
                                    width: 32,
                                    height: 32,
                                    backgroundColor: 'rgba(157, 92, 233, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(157, 92, 233, 0.2)',
                                    '& svg': {
                                      fontSize: '1.2rem',
                                      color: '#9D5CE9'
                                    },
                                    '&:hover': {
                                      backgroundColor: 'rgba(157, 92, 233, 0.2)',
                                      border: '1px solid rgba(157, 92, 233, 0.3)'
                                    }
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton 
                                  onClick={() => handleDeleteContent(content.id)}
                                  sx={{ 
                                    width: 32,
                                    height: 32,
                                    backgroundColor: 'rgba(255, 23, 68, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 23, 68, 0.2)',
                                    '& svg': {
                                      fontSize: '1.2rem',
                                      color: '#ff1744'
                                    },
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 23, 68, 0.2)',
                                      border: '1px solid rgba(255, 23, 68, 0.3)'
                                    }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                          <Typography sx={{ 
                            color: '#fff',
                            mb: 3,
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6
                          }}>
                            {content.description}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            {content.links?.website && (
                              <Button
                                href={content.links.website}
                                target="_blank"
                                startIcon={<LanguageIcon />}
                                sx={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  color: '#fff',
                                  textTransform: 'none',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#fff'
                                  }
                                }}
                              >
                                Website
                              </Button>
                            )}
                            {content.links?.twitter && (
                              <Button
                                href={content.links.twitter}
                                target="_blank"
                                startIcon={<TwitterIcon />}
                                sx={{
                                  backgroundColor: 'rgba(29, 161, 242, 0.1)',
                                  color: '#1DA1F2',
                                  textTransform: 'none',
                                  border: '1px solid rgba(29, 161, 242, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(29, 161, 242, 0.2)',
                                    border: '1px solid rgba(29, 161, 242, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#1DA1F2'
                                  }
                                }}
                              >
                                Twitter
                              </Button>
                            )}
                            {content.links?.discord && (
                              <Button
                                href={`https://discord.com/users/${content.links.discord}`}
                                target="_blank"
                                startIcon={<DiscordIcon />}
                                sx={{
                                  backgroundColor: 'rgba(88, 101, 242, 0.1)',
                                  color: '#5865F2',
                                  textTransform: 'none',
                                  border: '1px solid rgba(88, 101, 242, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(88, 101, 242, 0.2)',
                                    border: '1px solid rgba(88, 101, 242, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#5865F2'
                                  }
                                }}
                              >
                                Discord
                              </Button>
                            )}
                            {content.links?.gitbook && (
                              <Button
                                href={content.links.gitbook}
                                target="_blank"
                                startIcon={<BookIcon />}
                                sx={{
                                  backgroundColor: 'rgba(56, 132, 255, 0.1)',
                                  color: '#3884FF',
                                  textTransform: 'none',
                                  border: '1px solid rgba(56, 132, 255, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(56, 132, 255, 0.2)',
                                    border: '1px solid rgba(56, 132, 255, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#3884FF'
                                  }
                                }}
                              >
                                GitBook
                              </Button>
                            )}
                            {content.links?.medium && (
                              <Button
                                href={content.links.medium}
                                target="_blank"
                                startIcon={<ArticleIcon />}
                                sx={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  color: '#fff',
                                  textTransform: 'none',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#fff'
                                  }
                                }}
                              >
                                Medium
                              </Button>
                            )}
                            {content.links?.linkedin?.map((link, index) => (
                              <Button
                                key={index}
                                href={link.url}
                                target="_blank"
                                startIcon={<LinkedInIcon />}
                                sx={{
                                  backgroundColor: 'rgba(0, 119, 181, 0.1)',
                                  color: '#0077B5',
                                  textTransform: 'none',
                                  border: '1px solid rgba(0, 119, 181, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0, 119, 181, 0.2)',
                                    border: '1px solid rgba(0, 119, 181, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#0077B5'
                                  }
                                }}
                              >
                                {link.name || 'LinkedIn'}
                              </Button>
                            ))}
                            {content.links?.additional?.map((link, index) => (
                              <Button
                                key={index}
                                href={link}
                                target="_blank"
                                startIcon={<LanguageIcon />}
                                sx={{
                                  backgroundColor: 'rgba(157, 92, 233, 0.1)',
                                  color: '#9D5CE9',
                                  textTransform: 'none',
                                  border: '1px solid rgba(157, 92, 233, 0.2)',
                                  borderRadius: '8px',
                                  px: 2,
                                  height: '36px',
                                  minWidth: '120px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(157, 92, 233, 0.2)',
                                    border: '1px solid rgba(157, 92, 233, 0.3)',
                                  },
                                  '& .MuiButton-startIcon': {
                                    color: '#9D5CE9'
                                  }
                                }}
                              >
                                Link {content.links.additional.length > 1 ? index + 1 : ''}
                              </Button>
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Holdings Tab */}
              {activeTab === 2 && (
                <Box>
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        resetHoldingState();
                        setEditingHolding(null);
                        setIsAddingHolding(true);
                      }}
                      sx={{
                        background: 'linear-gradient(45deg, #9D5CE9, #7B40E4)',
                        color: '#fff',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #8A4CD8, #6930D3)'
                        }
                      }}
                    >
                      New Holding
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    {holdings.map((holding) => (
                      <Grid item xs={12} sm={6} md={4} key={holding.id}>
                        <HoldingCard holding={holding} />
                      </Grid>
                    ))}
                  </Grid>

                  <Dialog
                    open={isAddingHolding}
                    onClose={() => {
                      setIsAddingHolding(false);
                      setEditingHolding(null);
                      resetHoldingState();
                    }}
                    PaperProps={{
                      sx: { 
                        backgroundColor: 'rgba(18, 18, 18, 0.9)', 
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(157, 92, 233, 0.2)',
                        minWidth: '400px',
                        maxWidth: '90vw',
                        height: 'auto',
                        overflow: 'hidden'
                      }
                    }}
                  >
                    <DialogTitle sx={{ 
                      color: '#fff', 
                      borderBottom: '1px solid rgba(157, 92, 233, 0.2)',
                      pb: 2
                    }}>
                      {editingHolding ? 'Edit Holding' : 'Add New Holding'}
                    </DialogTitle>
                    <DialogContent>
                      <Box sx={{ p: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Type</InputLabel>
                          <Select
                            value={newHolding.type}
                            onChange={(e) => setNewHolding({ ...newHolding, type: e.target.value })}
                            sx={{ 
                              color: '#fff',
                              borderRadius: '8px',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(157, 92, 233, 0.3)',
                                borderRadius: '8px'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(157, 92, 233, 0.5)'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#9D5CE9'
                              }
                            }}
                          >
                            <MenuItem value="token">Token</MenuItem>
                            <MenuItem value="nft">NFT</MenuItem>
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          label="Name"
                          placeholder="Ticker"
                          value={newHolding.name}
                          onChange={(e) => setNewHolding({ ...newHolding, name: e.target.value })}
                          sx={{ 
                            mb: 2, 
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              borderRadius: '8px',
                              '& fieldset': {
                                borderColor: 'rgba(157, 92, 233, 0.3)',
                                borderRadius: '8px'
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(157, 92, 233, 0.5)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#9D5CE9'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)'
                            }
                          }}
                        />

                        <TextField
                          fullWidth
                          label="Description"
                          placeholder="Thesis"
                          multiline
                          rows={3}
                          value={newHolding.description}
                          onChange={(e) => {
                            const words = e.target.value.trim().split(/\s+/);
                            if (words.length <= 25 || e.target.value.length < newHolding.description.length) {
                              setNewHolding({ ...newHolding, description: e.target.value });
                            }
                          }}
                          helperText={`${newHolding.description.trim().split(/\s+/).filter(word => word.length > 0).length}/25 words`}
                          FormHelperTextProps={{
                            sx: { color: 'rgba(255, 255, 255, 0.5)' }
                          }}
                          sx={{ 
                            mb: 2, 
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              borderRadius: '8px',
                              '& fieldset': {
                                borderColor: 'rgba(157, 92, 233, 0.3)',
                                borderRadius: '8px'
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(157, 92, 233, 0.5)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#9D5CE9'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)'
                            }
                          }}
                        />

                        <TextField
                          fullWidth
                          label="Contract Address"
                          value={newHolding.contractAddress}
                          onChange={(e) => setNewHolding({ ...newHolding, contractAddress: e.target.value })}
                          sx={{ 
                            mb: 2, 
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              borderRadius: '8px',
                              '& fieldset': {
                                borderColor: 'rgba(157, 92, 233, 0.3)',
                                borderRadius: '8px'
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(157, 92, 233, 0.5)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#9D5CE9'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)'
                            }
                          }}
                        />

                        <TextField
                          fullWidth
                          label="Amount"
                          value={newHolding.amount}
                          onChange={(e) => setNewHolding({ ...newHolding, amount: e.target.value })}
                          sx={{ 
                            mb: 2, 
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              borderRadius: '8px',
                              '& fieldset': {
                                borderColor: 'rgba(157, 92, 233, 0.3)',
                                borderRadius: '8px'
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(157, 92, 233, 0.5)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#9D5CE9'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)'
                            }
                          }}
                        />

                        <TextField
                          fullWidth
                          label="Chain"
                          value={newHolding.chain}
                          onChange={(e) => setNewHolding({ ...newHolding, chain: e.target.value })}
                          sx={{ 
                            mb: 2, 
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              borderRadius: '8px',
                              '& fieldset': {
                                borderColor: 'rgba(157, 92, 233, 0.3)',
                                borderRadius: '8px'
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(157, 92, 233, 0.5)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#9D5CE9'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)'
                            }
                          }}
                        />
                      </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(157, 92, 233, 0.2)' }}>
                      <Button 
                        onClick={() => {
                          setIsAddingHolding(false);
                          setEditingHolding(null);
                          resetHoldingState();
                        }}
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: '#fff',
                            background: 'rgba(157, 92, 233, 0.1)'
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={editingHolding ? handleEditHolding : handleAddHolding}
                        variant="contained"
                        sx={{
                          background: 'linear-gradient(45deg, #9D5CE9, #7B40E4)',
                          color: '#fff',
                          borderRadius: '8px',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #8A4CD8, #6930D3)'
                          }
                        }}
                      >
                        {editingHolding ? 'Save' : 'Add'}
                      </Button>
                    </DialogActions>
                  </Dialog>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Dialogs only shown if user is profile owner */}
      {currentUser?.uid === userId && (
        <>
          {/* New Content Dialog */}
          <Dialog 
            open={openNewContent} 
            onClose={() => {
              setOpenNewContent(false);
              setEditingContent(null);
              setNewContentData({
                title: '',
                description: '',
                category: '',
                links: {
                  discord: '',
                  twitter: '',
                  linkedin: [], 
                  website: '',
                  gitbook: '',
                  medium: '',
                  additional: []
                }
              });
            }}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: { 
                backgroundColor: 'rgba(18, 18, 18, 0.95)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(157, 92, 233, 0.2)',
                minWidth: '800px',
                maxHeight: '90vh',
                height: '90vh',
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '20px',
                  padding: '1px',
                  background: 'linear-gradient(145deg, rgba(157, 92, 233, 0.5), rgba(110, 58, 211, 0.5))',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude'
                }
              }
            }}
            sx={{
              '& .MuiDialog-container': {
                alignItems: 'center',
                justifyContent: 'center',
              }
            }}
          >
            <Box sx={{ 
              position: 'relative',
              p: 4,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 4,
                flexShrink: 0
              }}>
                <Typography variant="h4" sx={{ 
                  color: '#fff', 
                  fontWeight: 600
                }}>
                  {editingContent ? 'Edit Content' : 'New Content'}
                </Typography>
                <IconButton 
                  onClick={() => {
                    setOpenNewContent(false);
                    setEditingContent(null);
                    setNewContentData({
                      title: '',
                      description: '',
                      category: '',
                      links: {
                        discord: '',
                        twitter: '',
                        linkedin: [], 
                        website: '',
                        gitbook: '',
                        medium: '',
                        additional: []
                      }
                    });
                  }}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      color: '#fff'
                    }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box sx={{ 
                flex: 1,
                overflowY: 'auto',
                pr: 2,
                mr: -2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(157, 92, 233, 0.3)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(157, 92, 233, 0.5)',
                  }
                },
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 3
                }}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={newContentData.title}
                    onChange={(e) => setNewContentData({ ...newContentData, title: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(38, 38, 38, 0.8)',
                        borderRadius: '12px',
                        height: '56px',
                        '& fieldset': {
                          borderColor: 'rgba(157, 92, 233, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(157, 92, 233, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#9D5CE9',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#9D5CE9',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#fff',
                        fontSize: '1.1rem',
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="Description"
                    value={newContentData.description}
                    onChange={(e) => setNewContentData({ ...newContentData, description: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(38, 38, 38, 0.8)',
                        borderRadius: '12px',
                        '& fieldset': {
                          borderColor: 'rgba(157, 92, 233, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(157, 92, 233, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#9D5CE9',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#9D5CE9',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#fff',
                        fontSize: '1.1rem',
                        lineHeight: 1.6
                      },
                    }}
                  />

                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 3,
                    backgroundColor: 'rgba(38, 38, 38, 0.4)',
                    borderRadius: '12px',
                    p: 3,
                    border: '1px solid rgba(157, 92, 233, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>Links</Typography>
                    
                    {/* Website Link */}
                    <TextField
                      fullWidth
                      label="Website Link"
                      value={newContentData.links.website}
                      onChange={(e) => handleLinkChange('website', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 1 }}>
                            <LanguageIcon />
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(38, 38, 38, 0.8)',
                          borderRadius: '12px',
                          height: '56px',
                          '& fieldset': {
                            borderColor: 'rgba(157, 92, 233, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(157, 92, 233, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#9D5CE9',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-focused': {
                            color: '#9D5CE9',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: '#fff',
                          fontSize: '1.1rem',
                        },
                      }}
                    />

                    {/* Twitter Link */}
                    <TextField
                      fullWidth
                      label="Twitter"
                      value={newContentData.links.twitter}
                      onChange={(e) => handleLinkChange('twitter', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ color: '#1DA1F2', mr: 1 }}>
                            <TwitterIcon />
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(38, 38, 38, 0.8)',
                          borderRadius: '12px',
                          height: '56px',
                          '& fieldset': {
                            borderColor: 'rgba(157, 92, 233, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(157, 92, 233, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#9D5CE9',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-focused': {
                            color: '#9D5CE9',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: '#fff',
                          fontSize: '1.1rem',
                        },
                      }}
                    />

                    {/* Discord Link */}
                    <TextField
                      fullWidth
                      label="Discord Username"
                      value={newContentData.links.discord}
                      onChange={(e) => {
                        // 
                        const username = e.target.value.replace('@', '');
                        setNewContentData(prev => ({ ...prev, links: { ...prev.links, discord: username } }));
                      }}
                      placeholder="username (without @)"
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ color: '#5865F2', mr: 1, display: 'flex', alignItems: 'center' }}>
                            <DiscordIcon />
                            <Typography sx={{ ml: 0.5, color: 'rgba(255, 255, 255, 0.7)' }}>@</Typography>
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(38, 38, 38, 0.8)',
                          borderRadius: '12px',
                          height: '56px',
                          '& fieldset': {
                            borderColor: 'rgba(157, 92, 233, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(157, 92, 233, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#9D5CE9',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-focused': {
                            color: '#9D5CE9',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: '#fff',
                          fontSize: '1.1rem',
                        },
                      }}
                    />

                    {/* GitBook Link */}
                    <TextField
                      fullWidth
                      label="GitBook Link"
                      value={newContentData.links.gitbook}
                      onChange={(e) => handleLinkChange('gitbook', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ color: '#3884FF', mr: 1 }}>
                            <BookIcon />
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(38, 38, 38, 0.8)',
                          borderRadius: '12px',
                          height: '56px',
                          '& fieldset': {
                            borderColor: 'rgba(157, 92, 233, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(157, 92, 233, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#9D5CE9',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-focused': {
                            color: '#9D5CE9',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: '#fff',
                          fontSize: '1.1rem',
                        },
                      }}
                    />

                    {/* Medium Link */}
                    <TextField
                      fullWidth
                      label="Medium Link"
                      value={newContentData.links.medium}
                      onChange={(e) => handleLinkChange('medium', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ color: '#fff', mr: 1 }}>
                            <ArticleIcon />
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(38, 38, 38, 0.8)',
                          borderRadius: '12px',
                          height: '56px',
                          '& fieldset': {
                            borderColor: 'rgba(157, 92, 233, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(157, 92, 233, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#9D5CE9',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-focused': {
                            color: '#9D5CE9',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: '#fff',
                          fontSize: '1.1rem',
                        },
                      }}
                    />

                    {/* LinkedIn Links */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(0, 119, 181, 0.1)',
                        borderRadius: '12px',
                        p: 2,
                        border: '1px solid rgba(0, 119, 181, 0.2)'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinkedInIcon sx={{ color: '#0077B5' }} />
                          <Typography sx={{ color: '#0077B5', fontWeight: 500 }}>
                            LinkedIn Links
                          </Typography>
                        </Box>
                        <Button
                          onClick={() => handleAddLink('linkedin')}
                          startIcon={<AddIcon />}
                          sx={{
                            color: '#0077B5',
                            backgroundColor: 'rgba(0, 119, 181, 0.1)',
                            borderRadius: '8px',
                            px: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(0, 119, 181, 0.2)',
                            },
                          }}
                        >
                          Add LinkedIn
                        </Button>
                      </Box>
                      {newContentData.links.linkedin.map((link, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          <TextField
                            fullWidth
                            placeholder="Name"
                            value={link.name}
                            onChange={(e) => handleLinkedInLinkChange(index, 'name', e.target.value)}
                            sx={{
                              flex: 1,
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                '& fieldset': {
                                  borderColor: 'rgba(157, 92, 233, 0.2)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(157, 92, 233, 0.3)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#9D5CE9'
                                }
                              },
                              '& .MuiOutlinedInput-input': {
                                color: '#fff',
                              },
                            }}
                          />
                          <TextField
                            fullWidth
                            placeholder="LinkedIn URL"
                            value={link.url}
                            onChange={(e) => handleLinkedInLinkChange(index, 'url', e.target.value)}
                            sx={{
                              flex: 2,
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                '& fieldset': {
                                  borderColor: 'rgba(157, 92, 233, 0.2)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(157, 92, 233, 0.3)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#9D5CE9'
                                }
                              },
                              '& .MuiOutlinedInput-input': {
                                color: '#fff',
                              },
                            }}
                          />
                          <IconButton 
                            onClick={() => handleRemoveLinkedInLink(index)}
                            sx={{
                              backgroundColor: 'rgba(255, 23, 68, 0.1)',
                              width: 40,
                              height: 40,
                              '& svg': {
                                fontSize: '1.2rem',
                                color: '#ff1744'
                              },
                              '&:hover': {
                                backgroundColor: 'rgba(255, 23, 68, 0.2)',
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>

                    {/* Additional Links */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(157, 92, 233, 0.1)',
                        borderRadius: '12px',
                        p: 2,
                        border: '1px solid rgba(157, 92, 233, 0.2)'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LanguageIcon sx={{ color: '#9D5CE9' }} />
                          <Typography sx={{ color: '#9D5CE9', fontWeight: 500 }}>
                            Additional Links
                          </Typography>
                        </Box>
                        <Button
                          onClick={() => handleAddLink('additional')}
                          startIcon={<AddIcon />}
                          sx={{
                            color: '#9D5CE9',
                            backgroundColor: 'rgba(157, 92, 233, 0.1)',
                            borderRadius: '8px',
                            px: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(157, 92, 233, 0.2)',
                            },
                          }}
                        >
                          Add Link
                        </Button>
                      </Box>
                      {newContentData.links.additional.map((link, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 2 }}>
                          <TextField
                            fullWidth
                            label={`Additional Link ${index + 1}`}
                            value={link}
                            onChange={(e) => handleLinkChange('additional', e.target.value, index)}
                            InputProps={{
                              startAdornment: (
                                <Box sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 1 }}>
                                  <LanguageIcon />
                                </Box>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(38, 38, 38, 0.8)',
                                borderRadius: '12px',
                                height: '56px',
                                '& fieldset': {
                                  borderColor: 'rgba(157, 92, 233, 0.2)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(157, 92, 233, 0.4)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#9D5CE9',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&.Mui-focused': {
                                  color: '#9D5CE9',
                                },
                              },
                              '& .MuiInputBase-input': {
                                color: '#fff',
                                fontSize: '1.1rem',
                              },
                            }}
                          />
                          <IconButton
                            onClick={() => handleRemoveLink('additional', index)}
                            sx={{
                              color: 'rgba(255, 255, 255, 0.5)',
                              '&:hover': {
                                color: '#ff4444',
                                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
                    <Select
                      value={newContentData.category}
                      onChange={(e) => setNewContentData({ ...newContentData, category: e.target.value })}
                      sx={{
                        color: '#fff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(157, 92, 233, 0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(157, 92, 233, 0.4)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#9D5CE9',
                        },
                        '& .MuiSelect-select': {
                          color: '#fff',
                          fontSize: '1.1rem',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '1.5rem',
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: 'rgba(38, 38, 38, 0.95)',
                            borderRadius: '12px',
                            border: '1px solid rgba(157, 92, 233, 0.2)',
                            '& .MuiMenuItem-root': {
                              color: '#fff',
                              '&:hover': {
                                backgroundColor: 'rgba(157, 92, 233, 0.1)',
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'rgba(157, 92, 233, 0.2)',
                                '&:hover': {
                                  backgroundColor: 'rgba(157, 92, 233, 0.3)',
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      {categories.map((category) => (
                        <MenuItem 
                          key={category.id} 
                          value={category.id}
                          sx={{
                            color: '#fff',
                            '&:hover': {
                              backgroundColor: 'rgba(157, 92, 233, 0.1)',
                            },
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(157, 92, 233, 0.2)',
                              '&:hover': {
                                backgroundColor: 'rgba(157, 92, 233, 0.3)',
                              },
                            },
                          }}
                        >
                          {category.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 2, 
                mt: 4,
                pt: 3,
                borderTop: '1px solid rgba(157, 92, 233, 0.2)',
                flexShrink: 0
              }}>
                <Button
                  onClick={() => {
                    setOpenNewContent(false);
                    setEditingContent(null);
                    setNewContentData({
                      title: '',
                      description: '',
                      category: '',
                      links: {
                        discord: '',
                        twitter: '',
                        linkedin: [], 
                        website: '',
                        gitbook: '',
                        medium: '',
                        additional: []
                      }
                    });
                  }}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveContent}
                  sx={{
                    backgroundColor: '#9D5CE9',
                    color: '#fff',
                    px: 4,
                    '&:hover': {
                      backgroundColor: '#6E3AD3'
                    }
                  }}
                >
                  {editingContent ? 'Update' : 'Save'}
                </Button>
              </Box>
            </Box>
          </Dialog>

          {/* Profile Edit Dialog */}
          <Dialog 
            open={isEditingProfile} 
            onClose={() => setIsEditingProfile(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: { 
                background: 'linear-gradient(135deg, rgba(35, 11, 52, 0.95) 0%, rgba(49, 22, 77, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
                color: 'white',
              }
            }}
          >
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              Edit Profile
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/*  */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <input
                    accept="image/*"
                    type="file"
                    id="profile-photo-input"
                    onChange={handleProfilePhotoChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profile-photo-input">
                    <Avatar
                      src={newPhotoFile ? URL.createObjectURL(newPhotoFile) : profileData.photoURL}
                      sx={{ 
                        width: 100, 
                        height: 100,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8
                        }
                      }}
                    />
                  </label>
                </Box>

                {/* Display Name */}
                <TextField
                  fullWidth
                  label="Display Name"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    displayName: e.target.value
                  })}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#9D5CE9' }
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />

                {/* Description */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={profileData.description}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    description: e.target.value
                  })}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#9D5CE9' }
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />

                {/* Categories */}
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Categories</InputLabel>
                  <Select
                    multiple
                    value={profileData.categories}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      categories: e.target.value
                    })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={categoryOptions.find(cat => cat.id === value)?.label}
                            sx={{
                              backgroundColor: 'rgba(157, 92, 233, 0.2)',
                              color: '#fff',
                              '& .MuiChip-deleteIcon': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&:hover': { color: '#fff' }
                              }
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    sx={{ 
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9D5CE9' }
                    }}
                  >
                    {categoryOptions.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Social Links */}
                <TextField
                  fullWidth
                  label="Twitter Username"
                  value={profileData.links.twitter}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    links: { ...profileData.links, twitter: e.target.value }
                  })}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ color: '#1DA1F2', mr: 1 }}>
                        <TwitterIcon />
                      </Box>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#9D5CE9' }
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />

                <TextField
                  fullWidth
                  label="Discord Username"
                  value={profileData.links.discord}
                  onChange={(e) => {
                    // 
                    const username = e.target.value.replace('@', '');
                    setProfileData({
                      ...profileData,
                      links: { ...profileData.links, discord: username }
                    });
                  }}
                  placeholder="username (without @)"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ color: '#5865F2', mr: 1, display: 'flex', alignItems: 'center' }}>
                        <DiscordIcon />
                        <Typography sx={{ ml: 0.5, color: 'rgba(255, 255, 255, 0.7)' }}>@</Typography>
                      </Box>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#9D5CE9' }
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />

                {/* Additional Links */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Additional Links
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      value={newAdditionalLink}
                      onChange={(e) => setNewAdditionalLink(e.target.value)}
                      placeholder="Enter link URL"
                      size="small"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '&.Mui-focused fieldset': { borderColor: '#9D5CE9' }
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddAdditionalLink}
                      variant="contained"
                      sx={{
                        bgcolor: 'rgba(157, 92, 233, 0.2)',
                        '&:hover': { bgcolor: 'rgba(157, 92, 233, 0.3)' }
                      }}
                    >
                      Add
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {profileData.links.additional.map((link, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ color: '#fff', flex: 1 }} noWrap>
                          {link}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveAdditionalLink(index)}
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
              <Button 
                onClick={() => setIsEditingProfile(false)}
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleProfileSave}
                variant="contained"
                sx={{
                  background: 'linear-gradient(45deg, #6E3AD3 30%, #9D5CE9 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5c2eb8 30%, #8c4bd8 90%)'
                  }
                }}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}