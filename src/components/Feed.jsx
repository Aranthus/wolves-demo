import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Avatar, Chip, Container, IconButton, SvgIcon } from '@mui/material';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArticleIcon from '@mui/icons-material/Article';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Custom Discord icon component
const DiscordIcon = (props) => (
  <SvgIcon {...props} viewBox="0 -5 24 34">
    <path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
  </SvgIcon>
);

const COLORS = {
  primary: '#6E3AD3', // 
  secondary: '#9D5CE9', // 
  background: '#1a0b2e', // 
  cardBg: 'rgba(35, 11, 52, 0.9)', // 
  hover: 'rgba(45, 21, 62, 0.95)', // 
  text: {
    primary: '#fff',
    secondary: '#b7a5d1', // 
    muted: '#8b7aa8' // 
  }
};

function Feed() {
  const [posts, setPosts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { id: 'all', label: 'All', color: '#6E3AD3' },
    { id: 'gaming', label: 'Gaming', color: '#FF1493' },
    { id: 'nft', label: 'NFT', color: '#7B68EE' },
    { id: 'token', label: 'Token', color: '#20B2AA' },
    { id: 'dao', label: 'DAO', color: '#FFA500' },
    { id: 'defi', label: 'DeFi', color: '#9370DB' }
  ];

  //
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // 

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const oneDayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    console.log('Filtering posts from:', oneDayAgo.toDate());
    
    const contentsRef = collection(db, 'contents');
    const q = query(
      contentsRef,
      where('createdAt', '>=', oneDayAgo),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        console.log('Total posts found:', snapshot.size);
        const postsData = [];
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          console.log('Post data:', data);
          
          // 
          if (data.userId) {
            const userDocRef = doc(db, 'users', data.userId);
            const userDocSnapshot = await getDoc(userDocRef);
            const userData = userDocSnapshot.exists() ? userDocSnapshot.data() : null;
            
            postsData.push({
              id: docSnapshot.id,
              ...data,
              name: userData?.name || data.name || 'Unknown User',
              photoURL: userData?.photoURL || null,
              title: userData?.title || null,
              company: userData?.company || null,
              contentTitle: data.title || '',  
              description: data.description || null,
              content: data.content || data.description || '',
              createdAt: data.createdAt
            });
          } else {
            postsData.push({
              id: docSnapshot.id,
              ...data,
              createdAt: data.createdAt
            });
          }
        }
        console.log('Processed posts:', postsData);
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    });

    return () => unsubscribe();
  }, []);

  // 
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // 
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    
    // 
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatHeaderDate = () => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRandomGradient = () => {
    const gradients = [
      'linear-gradient(135deg, #6E3AD3 0%, #9D5CE9 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
      'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
      'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
      'linear-gradient(135deg, #5B21B6 0%, #6D28D9 100%)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: COLORS.background,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: 'auto'
    }}>
      <Container maxWidth="md" sx={{ 
        py: 4, 
        bgcolor: COLORS.background 
      }}>
        {/*  */}
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            left: { xs: 16, md: 32 },
            top: { xs: 16, md: 32 },
            backgroundColor: 'rgba(110, 58, 211, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(110, 58, 211, 0.2)',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowBackIcon sx={{ color: COLORS.text.primary }} />
        </IconButton>

        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: 4, 
            color: COLORS.text.primary,
            textAlign: 'center',
            fontWeight: 600,
            background: 'linear-gradient(45deg, #6E3AD3 10%, #9D5CE9 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Today • {formatHeaderDate()}
        </Typography>

        {/* */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          mb: 4 
        }}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={category.label}
              onClick={() => setSelectedCategory(category.id)}
              sx={{
                backgroundColor: selectedCategory === category.id ? 
                  `${category.color}20` : 'rgba(110, 58, 211, 0.1)',
                color: selectedCategory === category.id ? 
                  category.color : COLORS.text.secondary,
                borderColor: selectedCategory === category.id ? 
                  category.color : 'transparent',
                border: '1px solid',
                '&:hover': {
                  backgroundColor: `${category.color}30`,
                },
                px: 2,
                py: 2.5,
                fontSize: '0.9rem',
                fontWeight: selectedCategory === category.id ? 600 : 400
              }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {posts.length === 0 ? (
            <Card sx={{ 
              bgcolor: COLORS.cardBg,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(97, 218, 251, 0.1)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}>
                <Typography sx={{ 
                  color: COLORS.text.secondary,
                  fontSize: '1.1rem',
                  fontWeight: 500
                }}>
                  {selectedCategory === 'all' ? 
                    'No posts' : 
                    `No posts in ${categories.find(c => c.id === selectedCategory)?.label} category`}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            posts
              .filter(post => selectedCategory === 'all' || post.category === selectedCategory)
              .map((post) => (
                <Card 
                  key={post.id} 
                  sx={{ 
                    bgcolor: COLORS.cardBg,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(97, 218, 251, 0.1)',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          background: post.photoURL ? 'none' : getRandomGradient(),
                          fontSize: '1.3rem',
                          fontWeight: 600,
                          boxShadow: '0 4px 12px rgba(110, 58, 211, 0.3)'
                        }}
                        src={post.photoURL}
                      >
                        {!post.photoURL && post.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            color: COLORS.text.primary,
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            mb: 0.5
                          }}
                        >
                          {post.name}
                        </Typography>
                        {post.createdAt && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: COLORS.text.muted,
                              fontSize: '0.8rem',
                              display: 'block',
                              mb: 0.5
                            }}
                          >
                            {formatTimestamp(post.createdAt)}
                          </Typography>
                        )}
                        {post.title && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: COLORS.text.secondary,
                              fontSize: '0.9rem'
                            }}
                          >
                            {post.title}
                          </Typography>
                        )}
                        {post.company && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: COLORS.text.muted,
                              fontSize: '0.85rem'
                            }}
                          >
                            {post.company}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {post.contentTitle && (
                      <Typography
                        sx={{
                          color: COLORS.text.primary,
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          mt: 2,
                          mb: 1
                        }}
                      >
                        {post.contentTitle}
                      </Typography>
                    )}

                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mb: 3, 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: COLORS.text.primary,
                        lineHeight: 1.7,
                        fontSize: '1rem',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {post.description || post.content}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {post.category && (
                        <Chip
                          label={post.category}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(110, 58, 211, 0.1)',
                            color: COLORS.secondary,
                            borderRadius: '16px',
                            fontWeight: 500,
                            border: '1px solid rgba(110, 58, 211, 0.2)',
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              bgcolor: 'rgba(110, 58, 211, 0.2)',
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {post.links && Object.entries(post.links).map(([platform, link]) => {
                        if (!link || (Array.isArray(link) && link.length === 0)) return null;
                        
                        let icon;
                        switch(platform) {
                          case 'discord':
                            icon = <DiscordIcon sx={{ fontSize: 20 }} />;
                            break;
                          case 'twitter':
                            icon = <TwitterIcon sx={{ fontSize: 20 }} />;
                            break;
                          case 'linkedin':
                            icon = <LinkedInIcon sx={{ fontSize: 20 }} />;
                            break;
                          case 'website':
                            icon = <LanguageIcon sx={{ fontSize: 20 }} />;
                            break;
                          case 'gitbook':
                            icon = <MenuBookIcon sx={{ fontSize: 20 }} />;
                            break;
                          case 'medium':
                            icon = <ArticleIcon sx={{ fontSize: 20 }} />;
                            break;
                          default:
                            return null;
                        }

                        const links = Array.isArray(link) ? link : [link];
                        
                        return links.map((url, index) => {
                          if (!url) return null;
                          return (
                            <Chip
                              key={`${platform}-${index}`}
                              icon={icon}
                              label={platform}
                              component="a"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              clickable
                              sx={{
                                background: 'rgba(110, 58, 211, 0.1)',
                                '&:hover': {
                                  background: 'rgba(110, 58, 211, 0.2)',
                                },
                                color: COLORS.text.secondary
                              }}
                            />
                          );
                        });
                      })}
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </Container>
      </Box>
    );
  }

  export default Feed;
