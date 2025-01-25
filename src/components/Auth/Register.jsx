import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const contentCategories = [
  { id: 'gaming', label: 'Gaming', color: '#FF4081' },
  { id: 'nft', label: 'NFT', color: '#7C4DFF' },
  { id: 'token', label: 'Token', color: '#00BCD4' },
  { id: 'memecoins', label: 'Memecoins', color: '#FFC107' },
  { id: 'ai', label: 'AI', color: '#4CAF50' }
];

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    selectedCategories: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleCategory = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords don't match");
    }

    if (formData.selectedCategories.length === 0) {
      return setError("Please select at least one category");
    }

    try {
      setError('');
      setLoading(true);

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: formData.name,
        email: formData.email,
        categories: formData.selectedCategories,
        createdAt: new Date().toISOString()
      });

      navigate('/');
    } catch (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" sx={{ color: '#fff', mb: 3 }}>
          Create Account
        </Typography>
        
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="name"
            label="Full Name"
            value={formData.name}
            onChange={handleChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1E2A3B',
                color: '#fff',
              },
              '& label': {
                color: '#64748B',
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1E2A3B',
                color: '#fff',
              },
              '& label': {
                color: '#64748B',
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1E2A3B',
                color: '#fff',
              },
              '& label': {
                color: '#64748B',
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1E2A3B',
                color: '#fff',
              },
              '& label': {
                color: '#64748B',
              },
            }}
          />

          <Typography sx={{ color: '#fff', mt: 2, mb: 1 }}>
            Select Categories
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {contentCategories.map(category => (
              <Chip
                key={category.id}
                label={category.label}
                onClick={() => toggleCategory(category.id)}
                sx={{
                  bgcolor: formData.selectedCategories.includes(category.id) ? category.color : 'transparent',
                  border: `1px solid ${category.color}`,
                  color: formData.selectedCategories.includes(category.id) ? '#fff' : category.color,
                  '&:hover': {
                    bgcolor: formData.selectedCategories.includes(category.id) 
                      ? `${category.color}CC`
                      : `${category.color}22`,
                  },
                }}
              />
            ))}
          </Stack>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              bgcolor: '#2196f3',
              '&:hover': {
                bgcolor: '#1976d2',
              },
            }}
          >
            Sign Up
          </Button>
          
          <Link component={RouterLink} to="/login" variant="body2" sx={{ color: '#64748B' }}>
            Already have an account? Sign In
          </Link>
        </Box>
      </Box>
    </Container>
  );
}
