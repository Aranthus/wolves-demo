import React, { useContext, useState, useEffect, createContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, userData) {
    try {
      // 
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // 
      await setDoc(doc(db, 'users', user.uid), {
        name: userData.name,
        email: user.email,
        createdAt: new Date().toISOString(),
        categories: [],
        deleted: false
      });

      console.log('User created successfully:', user.uid);
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    return signOut(auth);
  }

  async function deleteAccount() {
    if (!currentUser) return;

    try {
      // 
      await deleteDoc(doc(db, 'users', currentUser.uid));
      
      // 
      await deleteUser(currentUser);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
