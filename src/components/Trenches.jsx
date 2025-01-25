import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  IconButton, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  Paper,
  Grid,
  alpha,
  Collapse,
  Breadcrumbs,
  Link,
  InputAdornment,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  ExpandMore,
  ChevronRight,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Article as ArticleIcon,
  Timeline as TimelineIcon,
  Home as HomeIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  Newspaper as NewsIcon,
  AccountTree as StrategyIcon,
  School as SchoolIcon,
  SportsEsports as SportsEsportsIcon
} from '@mui/icons-material';
import {
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc,
  limit,
  deleteDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DRAWER_WIDTH = 240;

const CATEGORIES = {
  'trenches-reports': {
    title: 'Trenches Reports',
    icon: <ArticleIcon />,
    items: [],
    description: 'Detailed analysis and reports about our projects and strategies.'
  },
  'tokenomics': {
    title: 'Tokenomics',
    icon: <TimelineIcon />,
    items: [],
    description: 'Information about token economics, distribution, and utility.'
  },
  'wolves-education': {
    title: 'Wolves Education',
    icon: <SchoolIcon />,
    items: [],
    description: 'Educational resources and learning materials for our community.'
  },
  'games': {
    title: 'Gaming',
    icon: <SportsEsportsIcon />,
    items: [],
    description: 'Gaming projects, reviews, and strategies.'
  }
};

const Trenches = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();

  // 
  const getInitialCategory = () => {
    const savedCategory = localStorage.getItem('selectedCategory');
    return savedCategory && CATEGORIES[savedCategory] ? savedCategory : 'trenches-reports';
  };

  const getInitialItem = (category) => {
    const savedItem = localStorage.getItem('selectedItem');
    if (savedItem && CATEGORIES[category]?.items.includes(savedItem)) {
      return savedItem;
    }
    return CATEGORIES[category]?.title || '';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    // 
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return 'Invalid date';
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const renderNewContentButton = () => {
    if (!currentUser || !pageInfo || pageInfo.createdBy !== currentUser.uid) return null;
    
    return (
      <Button
        variant="contained"
        onClick={() => {
          setIsNewContent(true);
          setEditContent('');
          setEditDialogOpen(true);
        }}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
          mb: 2
        }}
      >
        New Content
      </Button>
    );
  };

  const handleSaveContent = async () => {
    if (!selectedCategory || !selectedItem || !currentUser) return;

    try {
      const contentData = {
        content: editContent,
        category: selectedCategory,
        item: selectedItem,
        updatedAt: new Date(),
        createdBy: currentUser.uid
      };

      if (isNewContent) {
        await addDoc(collection(db, 'trenches'), contentData);
      } else if (selectedDoc) {
        await updateDoc(doc(db, 'trenches', selectedDoc.id), contentData);
      }

      setEditDialogOpen(false);
      setSelectedDoc(null);
      setEditContent('');
      setIsNewContent(false);
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content. Please try again.');
    }
  };

  const handleDeleteContent = async (docId) => {
    if (!currentUser) return;
    
    try {
      const docRef = doc(db, 'trenches', docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    
    await handleDeleteContent(docToDelete);
    setDeleteDialogOpen(false);
    setDocToDelete(null);
  };

  const handleAddPage = async () => {
    if (!selectedCategoryForNewPage || !newPageName.trim() || !currentUser) return;

    const category = categories[selectedCategoryForNewPage];
    if (category) {
      const newPage = {
        name: newPageName.trim(),
        createdBy: currentUser.uid,
        createdAt: new Date(),
        category: selectedCategoryForNewPage
      };
      
      try {
        //
        await addDoc(collection(db, 'pages'), newPage);

        setNewPageName('');
        setAddPageDialogOpen(false);
        setSelectedCategoryForNewPage('');
        //
        setSelectedCategory(selectedCategoryForNewPage);
        setSelectedItem(newPage.name);
        localStorage.setItem('selectedCategory', selectedCategoryForNewPage);
        localStorage.setItem('selectedItem', newPage.name);
      } catch (error) {
        console.error('Error adding page:', error);
        alert('Error adding page. Please try again.');
      }
    }
  };

  const handleDeletePage = async () => {
    if (!pageToDelete.category || !pageToDelete.item || !currentUser || !pageInfo) return;
    
    // 
    if (pageInfo.createdBy !== currentUser.uid) {
      alert('You can only delete pages that you created');
      return;
    }

    try {
      // 
      const pagesQuery = query(
        collection(db, 'pages'),
        where('category', '==', pageToDelete.category),
        where('name', '==', pageToDelete.item)
      );
      
      const pagesSnapshot = await getDocs(pagesQuery);
      if (!pagesSnapshot.empty) {
        const pageDoc = pagesSnapshot.docs[0];
        if (pageDoc.data().createdBy === currentUser.uid) {
          // 
          const contentsQuery = query(
            collection(db, 'trenches'),
            where('category', '==', pageToDelete.category),
            where('item', '==', pageToDelete.item)
          );
          
          const batch = writeBatch(db);
          
          // 
          const contentsSnapshot = await getDocs(contentsQuery);
          contentsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
          
          // 
          batch.delete(pageDoc.ref);
          
          await batch.commit();

          // 
          setCategories(prevCategories => {
            const newCategories = { ...prevCategories };
            const categoryItems = newCategories[pageToDelete.category]?.items || [];
            const itemIndex = categoryItems.indexOf(pageToDelete.item);
            if (itemIndex > -1) {
              categoryItems.splice(itemIndex, 1);
            }
            return newCategories;
          });

          // 
          setSelectedCategory(pageToDelete.category);
          setSelectedItem(CATEGORIES[pageToDelete.category].title);
          setAllDocs([]); // 
          setPageInfo(null); // 
          
          localStorage.setItem('selectedCategory', pageToDelete.category);
          localStorage.setItem('selectedItem', CATEGORIES[pageToDelete.category].title);
        }
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Error deleting page. Please try again.');
    }

    setDeletePageDialogOpen(false);
    setPageToDelete({ category: '', item: '' });
  };

  // 
  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory);
  const [selectedItem, setSelectedItem] = useState(() => getInitialItem(getInitialCategory()));
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isNewContent, setIsNewContent] = useState(false);
  const [allDocs, setAllDocs] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [addPageDialogOpen, setAddPageDialogOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [selectedCategoryForNewPage, setSelectedCategoryForNewPage] = useState('');
  const [deletePageDialogOpen, setDeletePageDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState({ category: '', item: '' });
  const [pageInfo, setPageInfo] = useState(null);
  const [categories, setCategories] = useState(CATEGORIES);
  const [open, setOpen] = useState(selectedCategory);
  const [userDisplayNames, setUserDisplayNames] = useState({});

  useEffect(() => {
    if (!selectedCategory || !selectedItem) {
      setAllDocs([]);
      setPageInfo(null);
      return;
    }

    const category = categories[selectedCategory];
    if (!category) return;

    // 
    if (selectedItem === category.title) {
      setAllDocs([{
        id: 'category-description',
        content: category.description,
        updatedAt: new Date(),
        createdBy: 'system'
      }]);
      setPageInfo(null);
      return;
    }

    // 
    const q = query(
      collection(db, 'trenches'),
      where('category', '==', selectedCategory),
      where('item', '==', selectedItem),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllDocs(docs);
      // 
      if (docs.length > 0) {
        setSelectedDoc(docs[0]);
        setEditContent(docs[0].content || '');
      } else {
        setSelectedDoc(null);
        setEditContent('');
      }
    }, (error) => {
      console.error("Error fetching documents:", error);
      setAllDocs([]);
      setSelectedDoc(null);
      setEditContent('');
    });

    // 
    const pagesQuery = query(
      collection(db, 'pages'),
      where('category', '==', selectedCategory),
      where('name', '==', selectedItem),
      limit(1)
    );

    const unsubscribePages = onSnapshot(pagesQuery, (snapshot) => {
      if (!snapshot.empty) {
        setPageInfo(snapshot.docs[0].data());
      } else {
        setPageInfo(null);
      }
    });

    return () => {
      unsubscribe();
      unsubscribePages();
    };
  }, [selectedCategory, selectedItem]);

  useEffect(() => {
    const q = query(collection(db, 'pages'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedCategories = { ...CATEGORIES };
      
      snapshot.forEach((doc) => {
        const page = doc.data();
        if (updatedCategories[page.category]) {
          // 
          if (!updatedCategories[page.category].items.includes(page.name)) {
            updatedCategories[page.category].items.push(page.name);
          }
        }
      });
      
      setCategories(updatedCategories);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!CATEGORIES[selectedCategory]?.items.includes(selectedItem)) {
      setSelectedItem(CATEGORIES[selectedCategory]?.title || '');
    }
  }, [selectedCategory, selectedItem]);

  useEffect(() => {
    const category = getInitialCategory();
    const item = getInitialItem(category);
    
    setSelectedCategory(category);
    setSelectedItem(item);
    
    localStorage.setItem('selectedCategory', category);
    localStorage.setItem('selectedItem', item);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'pages'), (snapshot) => {
      const updatedCategories = { ...CATEGORIES };
      
      snapshot.forEach((doc) => {
        const pageData = doc.data();
        if (pageData.category && pageData.name) {
          if (!updatedCategories[pageData.category].items) {
            updatedCategories[pageData.category].items = [];
          }
          if (!updatedCategories[pageData.category].items.includes(pageData.name)) {
            updatedCategories[pageData.category].items.push(pageData.name);
          }
        }
      });
      
      setCategories(updatedCategories);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const displayNames = {};
      snapshot.forEach((doc) => {
        displayNames[doc.id] = doc.data().displayName;
      });
      setUserDisplayNames(displayNames);
    });

    return () => unsubscribe();
  }, []);

  const drawer = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: theme.spacing(2),
          color: 'white',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <IconButton
          onClick={() => window.location.href = '/'}
          sx={{ 
            mr: 1,
            color: 'rgba(255,255,255,0.7)',
            '&:hover': {
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Wolves Info Hub
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search in Hub..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
              '&::placeholder': {
                color: 'rgba(255,255,255,0.5)',
              },
            },
          }}
          sx={{
            mb: 2,
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(255,255,255,0.5)',
            },
          }}
        />
      </Box>

      <List>
        {Object.entries(categories).map(([key, category]) => (
          <Box key={key}>
            <ListItemButton
              onClick={() => {
                setSelectedCategory(key);
                setSelectedItem(category.title);
                localStorage.setItem('selectedCategory', key);
                localStorage.setItem('selectedItem', category.title);
              }}
              sx={{
                bgcolor: selectedCategory === key ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(124, 58, 237, 0.15)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'primary.main' }}>
                {category.icon}
              </ListItemIcon>
              <ListItemText 
                primary={category.title}
                primaryTypographyProps={{
                  sx: { 
                    color: selectedCategory === key ? 'primary.main' : 'rgba(255,255,255,0.7)',
                    fontWeight: selectedCategory === key ? 500 : 400
                  }
                }}
              />
            </ListItemButton>

            <Collapse in={selectedCategory === key}>
              <List component="div" disablePadding>
                {category.items.map((item) => (
                  <ListItemButton
                    key={item}
                    sx={{
                      pl: 4,
                      bgcolor: selectedItem === item ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(124, 58, 237, 0.15)',
                      },
                    }}
                    onClick={() => {
                      setSelectedCategory(key);
                      setSelectedItem(item);
                      localStorage.setItem('selectedCategory', key);
                      localStorage.setItem('selectedItem', item);
                    }}
                  >
                    <ListItemText 
                      primary={item}
                      primaryTypographyProps={{
                        sx: { 
                          color: selectedItem === item ? 'primary.main' : 'rgba(255,255,255,0.7)',
                          fontWeight: selectedItem === item ? 500 : 400,
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  </ListItemButton>
                ))}
                {currentUser && (
                  <Box sx={{ pl: 4 }}>
                    <ListItemButton
                      sx={{
                        color: 'primary.main',
                        mb: 1
                      }}
                      onClick={() => {
                        setSelectedCategoryForNewPage(key);
                        setAddPageDialogOpen(true);
                      }}
                    >
                      <AddIcon sx={{ fontSize: 20, mr: 1 }} />
                      <ListItemText 
                        primary="Add Page"
                        primaryTypographyProps={{
                          sx: { 
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }
                        }}
                      />
                    </ListItemButton>
                    
                    {selectedItem !== category.title && pageInfo?.createdBy === currentUser?.uid && (
                      <ListItemButton
                        sx={{
                          color: 'error.main',
                        }}
                        onClick={() => {
                          setPageToDelete({
                            category: key,
                            item: selectedItem
                          });
                          setDeletePageDialogOpen(true);
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 20, mr: 1 }} />
                        <ListItemText 
                          primary="Delete Selected Page"
                          primaryTypographyProps={{
                            sx: { 
                              fontSize: '0.875rem',
                              fontWeight: 500
                            }
                          }}
                        />
                      </ListItemButton>
                    )}
                  </Box>
                )}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>
    </>
  );

  const breadcrumbs = (
    <Breadcrumbs
      separator={<ChevronRight fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ color: 'rgba(255,255,255,0.7)' }}
    >
      <Link
        color="inherit"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setSelectedCategory(Object.keys(categories)[0]);
          setSelectedItem(categories[Object.keys(categories)[0]].title);
        }}
        sx={{ 
          color: 'rgba(255,255,255,0.7)',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline'
          }
        }}
      >
        Wolves Info Hub
      </Link>
      {selectedCategory && (
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setSelectedItem(categories[selectedCategory].title);
          }}
          sx={{ 
            color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          {categories[selectedCategory]?.title}
        </Link>
      )}
      {selectedItem && selectedItem !== categories[selectedCategory]?.title && (
        <Typography color="white">
          {selectedItem}
        </Typography>
      )}
    </Breadcrumbs>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0A0A0A', overflow: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: 'rgba(10,10,10,0.8)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {breadcrumbs}
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              bgcolor: '#0A0A0A',
              borderRight: '1px solid rgba(255,255,255,0.1)'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              bgcolor: '#0A0A0A',
              borderRight: '1px solid rgba(255,255,255,0.1)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          mt: { xs: '48px', sm: '48px' },
          height: '100vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <Box sx={{ 
          p: { xs: 2, sm: 3 },
          pr: { xs: 2, sm: 3, md: 13 }, 
          maxWidth: '1200px',
          mx: 'auto',
          width: '100%',
          ml: { sm: `${DRAWER_WIDTH}px` }
        }}>
          <Box sx={{ 
            bgcolor: 'rgba(255,255,255,0.05)',
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            maxWidth: '100%',
          }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
              {selectedItem}
            </Typography>

            {selectedItem && selectedItem !== categories[selectedCategory]?.title && renderNewContentButton()}

            {selectedItem === categories[selectedCategory]?.title ? (
              // 
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {categories[selectedCategory]?.description || ''}
              </Typography>
            ) : (
              // 
              <>
                {allDocs.map((doc) => (
                  <Paper
                    key={doc.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: '#1A1A1A',
                      color: 'white',
                      borderRadius: 2,
                      width: '100%',
                      maxWidth: '100%',
                      overflowX: 'hidden',
                      wordBreak: 'break-word'
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          color: 'rgba(255,255,255,0.9)',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          width: '100%'
                        }}
                      >
                        {doc.content}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      pt: 2
                    }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                          {formatTimestamp(doc.updatedAt)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          by {userDisplayNames[doc.createdBy] || 'Unknown User'}
                        </Typography>
                      </Box>
                      {currentUser && currentUser.uid === pageInfo?.createdBy && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setEditContent(doc.content);
                              setIsNewContent(false);
                              setEditDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              setDocToDelete(doc.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                ))}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Edit Content Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1A1A1A',
            backgroundImage: 'none',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {isNewContent ? 'New Content' : 'Edit Content'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            multiline
            rows={15}
            fullWidth
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.05)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                },
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.1)',
                },
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              '&:hover': {
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveContent} 
            variant="contained" 
            color="primary"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDocToDelete(null);
        }}
        PaperProps={{
          sx: {
            bgcolor: '#1A1A1A',
            backgroundImage: 'none',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          Delete Content
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Are you sure you want to delete this content? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setDocToDelete(null);
            }}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              '&:hover': {
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            sx={{
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark',
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Page Dialog */}
      <Dialog 
        open={addPageDialogOpen}
        onClose={() => {
          setAddPageDialogOpen(false);
          setNewPageName('');
          setSelectedCategoryForNewPage('');
        }}
        PaperProps={{
          sx: {
            bgcolor: '#1A1A1A',
            backgroundImage: 'none',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          Add New Page
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Page Name"
            type="text"
            fullWidth
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.05)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                },
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.1)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.7)',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: 'primary.main',
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
          <Button 
            onClick={() => {
              setAddPageDialogOpen(false);
              setNewPageName('');
              setSelectedCategoryForNewPage('');
            }}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              '&:hover': {
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleAddPage} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Page Dialog */}
      <Dialog
        open={deletePageDialogOpen}
        onClose={() => {
          setDeletePageDialogOpen(false);
          setPageToDelete({ category: '', item: '' });
        }}
        PaperProps={{
          sx: {
            bgcolor: '#1A1A1A',
            backgroundImage: 'none',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          Delete Page
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Are you sure you want to delete this page? All content within this page will be permanently deleted. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
          <Button 
            onClick={() => {
              setDeletePageDialogOpen(false);
              setPageToDelete({ category: '', item: '' });
            }}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              '&:hover': {
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeletePage}
            color="error" 
            variant="contained"
            sx={{
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark',
              }
            }}
          >
            Delete Page
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Trenches;
