import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Drawer,
  useTheme,
  Divider,
  Link,
  Container
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  deleteDoc, 
  doc, 
  updateDoc,
  orderBy,
  serverTimestamp,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format as dateFormat, isSameDay, isSameMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = {
  ADDED: 'Added',
  ADJUSTED: 'Adjusted/Updated',
  LAUNCHED: 'Launched/Ended',
  VIDEO: 'Video Highlights'
};

const drawerWidth = 240;

function Calendar() {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    description: '',
    category: CATEGORIES.ADDED
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // 
  const today = new Date();
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: today,
    end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
  });

  // Generate date ranges for the next 30 days (grouped by 1 day)
  const generateDateRanges = () => {
    const ranges = [];
    const startDate = new Date(2025, 0, 1); // 
    
    for (let i = 0; i < 365; i++) { // 
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      ranges.push({
        start: date,
        end: date,
        label: date.toLocaleDateString('en-US', { 
          day: 'numeric',
          month: 'long'
        })
      });
    }
    return ranges;
  };

  // Event listener
  useEffect(() => {
    if (!currentUser) return;

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => {
        const data = doc.data();
        // 
        let timestamp;
        if (data.timestamp && typeof data.timestamp === 'object' && data.timestamp.seconds) {
          // 
          timestamp = data.timestamp.seconds * 1000;
        } else if (data.timestamp && !isNaN(data.timestamp)) {
          // Unix timestamp
          timestamp = data.timestamp;
        } else {
          // 
          timestamp = new Date().getTime();
        }

        return {
          id: doc.id,
          ...data,
          timestamp: timestamp
        };
      });
      setEvents(eventsList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 
  const getEventsForDateRange = (dateRange) => {
    if (!dateRange || !events.length) return {
      added: [],
      adjusted: [],
      launched: [],
      video: []
    };

    const startOfDay = new Date(dateRange.start);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateRange.start);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = startOfDay.getTime();
    const endTimestamp = endOfDay.getTime();

    const filteredEvents = events.filter(event => {
      return event.timestamp >= startTimestamp && event.timestamp <= endTimestamp;
    });

    return {
      added: filteredEvents.filter(e => e.category === CATEGORIES.ADDED),
      adjusted: filteredEvents.filter(e => e.category === CATEGORIES.ADJUSTED),
      launched: filteredEvents.filter(e => e.category === CATEGORIES.LAUNCHED),
      video: filteredEvents.filter(e => e.category === CATEGORIES.VIDEO)
    };
  };

  // 
  const formatEventText = (event) => {
    if (!event || !event.description) return null;

    const cleanedText = cleanEventText(event.description);
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    //
    const lines = cleanedText.split(/\n|(?<=\.) /);

    return (
      <Box sx={{ width: '100%' }}>
        {lines.map((line, lineIndex) => {
          if (!line.trim()) return null;

          // 
          const parts = line.split(urlRegex);

          return (
            <Typography
              key={lineIndex}
              component="div"
              sx={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.95)',
                mb: 0.8,
                lineHeight: 1.4
              }}
            >
              {parts.map((part, partIndex) => {
                if (part.match(urlRegex)) {
                  return (
                    <Link
                      key={partIndex}
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {part}
                    </Link>
                  );
                }
                return part;
              })}
            </Typography>
          );
        })}
      </Box>
    );
  };

  // 
  const cleanEventText = (text) => {
    return text
      .replace(/^(Added|Adjusted\/Updated|Launched\/Ended|Video Highlights):/i, '')
      .replace(/^[-•]/g, '')
      .trim();
  };

  // 
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return dateFormat(date, 'dd MMM, HH:mm');
  };

  // 
  const renderColumn = (title, events) => (
    <Box sx={{ 
      bgcolor: 'rgba(255,255,255,0.03)',
      borderRadius: 2,
      p: 2,
      height: '100%',
      overflow: 'hidden'
    }}>
      <Typography 
        variant="subtitle1" 
        sx={{ 
          color: 'primary.main',
          mb: 2,
          fontWeight: 600 
        }}
      >
        {title}
      </Typography>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflow: 'auto',
        maxHeight: 'calc(100vh - 300px)'
      }}>
        {events.map((event, index) => (
          <Box
            key={index}
            sx={{
              bgcolor: 'rgba(255,255,255,0.05)',
              p: 2,
              borderRadius: 1,
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
              '&:hover': {
                '& .action-buttons': {
                  opacity: 1
                }
              }
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {event.description}
            </Typography>
            <Box sx={{ 
              mt: 1, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative'
            }}>
              <Typography variant="caption" sx={{ color: 'primary.main' }}>
                {event.category}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {formatTimestamp(event.timestamp)}
                </Typography>
                <Box 
                  className="action-buttons"
                  sx={{ 
                    display: 'flex',
                    gap: 0.5,
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                    '& .MuiIconButton-root': {
                      p: 0.5
                    }
                  }}
                >
                  <IconButton 
                    size="small"
                    onClick={() => {
                      setEditingEvent(event);
                      setNewEvent({ ...newEvent, description: event.description });
                      setIsEditing(true);
                    }} 
                    sx={{ 
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => handleDeleteEvent(event.id)} 
                    sx={{ 
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: 'rgba(255,77,77,0.1)'
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  // 
  const handleDeleteEvent = async (eventId) => {
    if (!eventId || !currentUser) {
      console.error('No event ID or user not logged in');
      return;
    }

    try {
      // 
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) {
        console.error('Event not found');
        return;
      }

      const eventData = eventSnap.data();
      
      // 
      if (eventData.userId !== currentUser.uid) {
        alert('You can only delete your own events');
        return;
      }

      await deleteDoc(eventRef);
      
      // 
      setEvents(events.filter(event => event.id !== eventId));
      
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event: ' + error.message);
    }
  };

  // 
  const handleEditEvent = async () => {
    if (!editingEvent || !newEvent.description) return;

    try {
      const eventRef = doc(db, 'events', editingEvent.id);
      const now = new Date().getTime();
      const eventData = {
        description: newEvent.description,
        category: newEvent.category,
        timestamp: now,
        userId: currentUser.uid
      };

      await updateDoc(eventRef, eventData);

      // 
      setEvents(events.map(event => 
        event.id === editingEvent.id 
          ? { ...event, ...eventData }
          : event
      ));

      // 
      setNewEvent({
        description: '',
        category: CATEGORIES.ADDED
      });
      setIsEditing(false);
      setEditingEvent(null);

    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event: ' + error.message);
    }
  };

  // 
  const handleAddEvent = async () => {
    if (!newEvent.description || !newEvent.category) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const now = new Date().getTime();
      const eventData = {
        description: newEvent.description,
        category: newEvent.category,
        timestamp: now,
        userId: currentUser.uid
      };

      const docRef = await addDoc(collection(db, 'events'), eventData);

      // 
      setEvents([...events, {
        ...eventData,
        id: docRef.id
      }]);

      // 
      setNewEvent({
        description: '',
        category: CATEGORIES.ADDED
      });

    } catch (error) {
      console.error('Error adding event:', error);
      alert('Error adding event: ' + error.message);
    }
  };

  const getDateRange = () => {
    const startDate = new Date(selectedDateRange.start);
    const endDate = new Date(selectedDateRange.end);
    const dates = [];

    while (startDate <= endDate) {
      dates.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }

    return dates;
  };

  // 
  const scrollRef = React.useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // 
  const handleScroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = direction === 'left' ? -100 : 100;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setScrollPosition(container.scrollLeft + scrollAmount);
  };

  // 
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handleDateChange('prev');
      } else if (e.key === 'ArrowRight') {
        handleDateChange('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 
  const handleDateChange = (direction) => {
    const newDate = new Date(selectedDateRange.start);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDateRange({
      start: newDate,
      end: new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0)
    });
  };

  // 
  const handleDateSelect = (date) => {
    setSelectedDateRange({
      start: date,
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0)
    });

    // 
    const container = scrollRef.current;
    if (container) {
      const buttons = container.getElementsByTagName('button');
      const selectedButton = Array.from(buttons).find(
        button => button.textContent.includes(dateFormat(date, 'd'))
      );
      
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ 
      minHeight: '100vh',
      bgcolor: '#1a0b2e',
      pt: 4
    }}>
      <Box sx={{ py: 4 }}>
        {/* Calendar Navigation */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          bgcolor: 'rgba(255,255,255,0.02)'
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => navigate('/')}
              sx={{ 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <HomeIcon />
            </IconButton>

            <IconButton
              onClick={() => handleDateChange('prev')}
              sx={{ 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>

          <Typography 
            variant="h4" 
            sx={{ 
              flex: 1,
              textAlign: 'center',
              color: '#fff',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #9D5CE9 0%, #6E3AD3 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(157, 92, 233, 0.3)',
            }}
          >
            Gaming Calendar
          </Typography>

          <IconButton
            onClick={() => handleDateChange('next')}
            sx={{ 
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Scrollable Days */}
        <Box 
          ref={scrollRef}
          sx={{ 
            display: 'flex',
            overflowX: 'auto',
            p: 1,
            bgcolor: 'rgba(255,255,255,0.02)',
            scrollBehavior: 'smooth',
            '&::-webkit-scrollbar': {
              display: 'none'  // 
            },
            msOverflowStyle: 'none',  // 
            scrollbarWidth: 'none',   //
          }}
        >
          {Array.from({ length: 30 }, (_, i) => {
            const date = new Date(selectedDateRange.start);
            date.setDate(date.getDate() - 15 + i);
            const isSelected = isSameDay(date, selectedDateRange.start);
            const isToday = isSameDay(date, new Date());

            return (
              <Button
                key={i}
                onClick={() => handleDateSelect(date)}
                sx={{
                  minWidth: '100px',
                  height: '70px',
                  mx: 0.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  bgcolor: isSelected ? 'primary.main' : 'transparent',
                  border: isToday ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.dark' : 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                  {dateFormat(date, 'yyyy')}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.8rem' }}>
                  {dateFormat(date, 'MMM')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400, fontSize: '1.1rem' }}>
                  {dateFormat(date, 'd')}
                </Typography>
              </Button>
            );
          })}
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
          {selectedDateRange ? (
            <>
              {/* */}
              {currentUser && (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        mb: 1
                      }}
                    >
                      Category
                    </Typography>
                    <Select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      sx={{
                        width: '100%',
                        bgcolor: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      {Object.values(CATEGORIES).map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>

                  <TextField
                    multiline
                    rows={4}
                    placeholder="Add your content here..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    sx={{
                      width: '100%',
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.05)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)'
                        }
                      }
                    }}
                  />

                  <Button
                    variant="contained"
                    onClick={isEditing ? handleEditEvent : handleAddEvent}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                  >
                    {isEditing ? 'Update Content' : 'Save Content'}
                  </Button>
                </Box>
              )}
              {/* Four Column Layout */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: 2,
                minHeight: 0,
                flex: 1,
                '& > div': {
                  minWidth: 0, // 
                  '& > div': { // 
                    wordBreak: 'break-word', // 
                    whiteSpace: 'normal', // 
                    overflow: 'hidden', // 
                    textOverflow: 'ellipsis' // 
                  }
                }
              }}>
                {renderColumn('Added', getEventsForDateRange(selectedDateRange).added)}
                {renderColumn('Adjusted/Updated', getEventsForDateRange(selectedDateRange).adjusted)}
                {renderColumn('Launched/Ended', getEventsForDateRange(selectedDateRange).launched)}
                {renderColumn('Video Highlights', getEventsForDateRange(selectedDateRange).video)}
              </Box>
            </>
          ) : (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: 'center', mt: 4, color: 'rgba(255,255,255,0.7)' }}
            >
              Select a date from above to see content
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default Calendar;