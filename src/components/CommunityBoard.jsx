import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  Container,
  Avatar,
  IconButton,
  Chip,
  Stack,
  TextField,
  SvgIcon
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import TwitterIcon from '@mui/icons-material/Twitter';
import ArticleIcon from '@mui/icons-material/Article';
import LanguageIcon from '@mui/icons-material/Language';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Custom Discord icon component
const DiscordIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.02.06.03.09.02c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/>
          </SvgIcon>
        );

const contentCategories = [
  { id: 'gaming', label: 'Gaming', color: '#FF4081' },
  { id: 'nft', label: 'NFT', color: '#7C4DFF' },
  { id: 'token', label: 'Token', color: '#00BCD4' },
  { id: 'memecoins', label: 'Memecoins', color: '#FFC107' },
  { id: 'ai', label: 'AI', color: '#4CAF50' }
];

const StyledListItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  background: 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))',
  marginBottom: theme.spacing(2.5),
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(38, 38, 38, 0.5)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: 'linear-gradient(145deg, rgba(28, 28, 28, 0.95), rgba(23, 23, 23, 0.85))',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(64, 64, 64, 0.6)'
  }
}));

export default function CommunityBoard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const validUsers = [];

        for (const doc of snapshot.docs) {
          const userData = doc.data();
          
          // 
          if (!userData || !userData.email || !userData.name || userData.deleted) {
            console.log('Skipping invalid user:', doc.id);
            continue;
          }

          // 
          const contentsQuery = query(collection(db, 'contents'), where('userId', '==', doc.id));
          const holdingsQuery = query(collection(db, 'holdings'), where('userId', '==', doc.id));
          
          const [contentsSnapshot, holdingsSnapshot] = await Promise.all([
            getDocs(contentsQuery),
            getDocs(holdingsQuery)
          ]);

          validUsers.push({
            id: doc.id,
            name: userData.name,
            email: userData.email,
            photoURL: userData.photoURL,
            description: userData.description,
            links: userData.links || {},
            categories: Array.isArray(userData.categories) ? userData.categories : [],
            createdAt: userData.createdAt,
            stats: {
              posts: contentsSnapshot.size,
              holdings: holdingsSnapshot.size
            }
          });
        }

        console.log('Valid users:', validUsers);
        setUsers(validUsers);
      } catch (error) {
        console.error('Error processing users:', error);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleUserClick = (userId) => {
    navigate(`/member/${userId}`);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategories.length === 0 || 
                          user.categories?.some(cat => selectedCategories.includes(cat));
    
    return matchesSearch && matchesCategory;
  });

  // 
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    // 
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    }
    
    // 
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleDateString();
    }
    
    return 'Unknown';
  };

  return (
    <Container maxWidth="xl" sx={{ 
      minHeight: '100vh',
      bgcolor: '#1a0b2e',
      pt: 4
    }}>
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          pb: 2,
          borderBottom: '1px solid rgba(157, 92, 233, 0.2)'
        }}>
          <Box sx={{ width: '200px' }}>
            <img 
              src="/wolves-dao-glow.png" 
              alt="Wolves DAO" 
              style={{ 
                width: '150px', 
                height: 'auto'
              }} 
            />
          </Box>
          
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              color: 'primary.main',
              textAlign: 'center',
              flex: 1
            }}>
            Wolves Members
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            width: '200px',
            justifyContent: 'flex-end'
          }}>
            <Button
              variant="contained"
              onClick={() => navigate('/feed')}
              sx={{ 
                minWidth: 'auto',
                height: '32px',
                px: 2,
                background: 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))',
                borderRadius: '16px',
                textTransform: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                border: '1px solid rgba(38, 38, 38, 0.8)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                color: '#4CAF50',
                '&:hover': {
                  background: 'linear-gradient(145deg, rgba(28, 28, 28, 0.95), rgba(23, 23, 23, 0.85))',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                  borderColor: '#4CAF50'
                }
              }}
            >
              Feed
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/wolves-info-hub')}
              sx={{ 
                minWidth: 'auto',
                height: '32px',
                px: 2,
                background: 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))',
                borderRadius: '16px',
                textTransform: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                border: '1px solid rgba(38, 38, 38, 0.8)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                color: '#FF1493',
                '&:hover': {
                  background: 'linear-gradient(145deg, rgba(28, 28, 28, 0.95), rgba(23, 23, 23, 0.85))',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                  borderColor: '#FF1493'
                }
              }}
            >
              Playbook
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/calendar')}
              sx={{ 
                minWidth: 'auto',
                height: '32px',
                px: 2,
                background: 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))',
                borderRadius: '16px',
                textTransform: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                border: '1px solid rgba(38, 38, 38, 0.8)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                color: '#FFA500',
                '&:hover': {
                  background: 'linear-gradient(145deg, rgba(28, 28, 28, 0.95), rgba(23, 23, 23, 0.85))',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                  borderColor: '#FFA500'
                }
              }}
            >
              Calendar
            </Button>
            {currentUser ? (
              <Button
                variant="contained"
                onClick={() => navigate(`/member/${currentUser.uid}`)}
                sx={{ 
                  minWidth: 'auto',
                  height: '32px',
                  px: 2,
                  background: 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))',
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  border: '1px solid rgba(38, 38, 38, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  color: '#9D5CE9',
                  '&:hover': {
                    background: 'linear-gradient(145deg, rgba(28, 28, 28, 0.95), rgba(23, 23, 23, 0.85))',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                    borderColor: '#9D5CE9'
                  }
                }}
              >
                Profile
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ 
                  minWidth: 'auto',
                  height: '32px',
                  px: 2,
                  background: 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))',
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  border: '1px solid rgba(38, 38, 38, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  color: '#9D5CE9',
                  '&:hover': {
                    background: 'linear-gradient(145deg, rgba(28, 28, 28, 0.95), rgba(23, 23, 23, 0.85))',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                    borderColor: '#9D5CE9'
                  }
                }}
              >
                Login
              </Button>
            )}
          </Box>
        </Box>

        {/* Search and Categories Container */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '600px',
          mx: 'auto',
          mb: 4
        }}>
          {/* Search */}
          <Box sx={{ width: '100%', mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon 
                    sx={{ 
                      color: 'rgba(157, 92, 233, 0.7)',
                      mr: 1,
                      fontSize: '1.5rem'
                    }} 
                  />
                ),
                endAdornment: searchTerm && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      '&:hover': {
                        color: 'rgba(157, 92, 233, 0.7)',
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '56px',
                  color: '#fff',
                  background: 'linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(18, 18, 18, 0.8))',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  '& fieldset': { 
                    border: '1px solid rgba(38, 38, 38, 0.8)',
                    borderRadius: '16px',
                  },
                  '&:hover fieldset': { 
                    borderColor: 'rgba(157, 92, 233, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(157, 92, 233, 0.6)',
                    borderWidth: '1px',
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 0 20px rgba(157, 92, 233, 0.15)',
                  }
                },
                '& .MuiOutlinedInput-input': {
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  }
                }
              }}
            />
          </Box>

          {/* Categories */}
          <Box sx={{ 
            width: '100%',
            padding: '8px 0',
          }}>
            <Stack 
              direction="row" 
              spacing={1}
              justifyContent="center"
              sx={{ 
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '2px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(157, 92, 233, 0.3)',
                  borderRadius: '2px',
                  '&:hover': {
                    background: 'rgba(157, 92, 233, 0.5)',
                  }
                }
              }}
            >
              {contentCategories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.label}
                  onClick={() => toggleCategory(category.id)}
                  sx={{
                    height: '32px',
                    background: selectedCategories.includes(category.id) 
                      ? `linear-gradient(135deg, ${category.color}40, ${category.color}20)`
                      : 'rgba(18, 18, 18, 0.6)',
                    backdropFilter: 'blur(10px)',
                    color: selectedCategories.includes(category.id) ? category.color : 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${selectedCategories.includes(category.id) ? category.color : 'rgba(255, 255, 255, 0.1)'}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${category.color}30, ${category.color}10)`,
                      borderColor: category.color,
                      color: category.color
                    },
                    px: 2,
                    '& .MuiChip-label': {
                      fontSize: '0.85rem',
                      fontWeight: selectedCategories.includes(category.id) ? 500 : 400,
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>

        {/* User List */}
        <Box>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <StyledListItem
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  {/*  */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    <Avatar 
                      src={user.photoURL}
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        background: 'linear-gradient(145deg, #262626, #171717)',
                        border: '2px solid rgba(64, 64, 64, 0.6)',
                        boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
                        color: '#9D5CE9',
                        fontSize: '2rem'
                      }}
                    >
                      {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#fff',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                          mb: 0.5
                        }}
                      >
                        {user.name}
                      </Typography>
                      {user.description && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            mb: 1,
                            maxWidth: '500px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {user.description}
                        </Typography>
                      )}
                      {/*  */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 3, 
                        mt: 1,
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}>
                        <Typography variant="body2" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 0.5,
                          color: '#9D5CE9'
                        }}>
                          <ArticleIcon sx={{ fontSize: 16 }} />
                          {user.stats?.posts || 0} Posts
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 0.5,
                          color: '#4CAF50'
                        }}>
                          <LanguageIcon sx={{ fontSize: 16 }} />
                          {user.stats?.holdings || 0} Holdings
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/*  */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {user.links?.twitter && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <TwitterIcon sx={{ fontSize: 16, color: '#1DA1F2' }} />
                          {user.links.twitter}
                        </Typography>
                      )}
                      {user.links?.discord && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <DiscordIcon sx={{ fontSize: 16, color: '#7289DA' }} />
                          {user.links.discord}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {user.categories?.map((category, index) => {
                        const categoryInfo = contentCategories.find(c => c.id === category);
                        return (
                          <Chip
                            key={index}
                            label={categoryInfo?.label || category}
                            size="small"
                            sx={{
                              bgcolor: `${categoryInfo?.color}22`,
                              color: categoryInfo?.color,
                              border: `1px solid ${categoryInfo?.color}44`,
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                </Box>
              </StyledListItem>
            ))
          ) : (
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', mt: 4 }}>
              No users found matching your criteria
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
}
