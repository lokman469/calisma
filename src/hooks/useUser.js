import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'users';
const CACHE_KEY = 'user_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat
const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const USER_ROLES = {
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin'
};

const VERIFICATION_TYPES = {
  EMAIL: 'email',
  PHONE: 'phone',
  ID: 'id',
  ADDRESS: 'address'
};

export const useUser = (options = {}) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const auth = getAuth();
  const storage = getStorage();
  const lastFetchRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  const {
    enableCache = true,
    autoRefresh = true,
    refreshInterval = 3600000, // 1 saat
    includeMetadata = true,
    includeStats = true,
    validateFields = true
  } = options;

  // Cache yönetimi
  const loadFromCache = useCallback(() => {
    if (!enableCache) return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${auth.currentUser?.uid}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Cache okuma hatası:', err);
    }
    return null;
  }, [enableCache, auth.currentUser]);

  const saveToCache = useCallback((data) => {
    if (!enableCache || !auth.currentUser) return;
    
    try {
      localStorage.setItem(`${CACHE_KEY}_${auth.currentUser.uid}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Cache yazma hatası:', err);
    }
  }, [enableCache, auth.currentUser]);

  // Kullanıcı profili getir
  const fetchUserProfile = useCallback(async (uid, silent = false) => {
    if (!uid) return null;
    if (!silent) setLoading(true);
    setError(null);

    try {
      // Cache kontrol
      if (!silent) {
        const cached = loadFromCache();
        if (cached) {
          setProfile(cached);
          setLoading(false);
          return cached;
        }
      }

      const docRef = doc(db, COLLECTION_NAME, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profileData = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          lastLogin: docSnap.data().lastLogin?.toDate()
        };

        if (includeMetadata) {
          const metadataRef = doc(db, `${COLLECTION_NAME}_metadata`, uid);
          const metadataSnap = await getDoc(metadataRef);
          if (metadataSnap.exists()) {
            profileData.metadata = metadataSnap.data();
          }
        }

        if (includeStats) {
          const statsRef = doc(db, `${COLLECTION_NAME}_stats`, uid);
          const statsSnap = await getDoc(statsRef);
          if (statsSnap.exists()) {
            profileData.stats = statsSnap.data();
          }
        }

        setProfile(profileData);
        saveToCache(profileData);
        lastFetchRef.current = Date.now();

        if (!silent) setLoading(false);
        return profileData;
      }

      return null;

    } catch (err) {
      console.error('Profil getirme hatası:', err);
      setError(err.message);
      if (!silent) setLoading(false);
      return null;
    }
  }, [loadFromCache, saveToCache, includeMetadata, includeStats]);

  // Kullanıcı kaydı
  const register = useCallback(async (email, password, userData) => {
    setLoading(true);
    setError(null);

    try {
      // Alan validasyonu
      if (validateFields) {
        if (!email || !password || !userData.username) {
          throw new Error('Gerekli alanlar eksik');
        }
        if (password.length < 6) {
          throw new Error('Şifre en az 6 karakter olmalıdır');
        }
        // Diğer validasyonlar...
      }

      // Username kontrolü
      const usernameQuery = query(
        collection(db, COLLECTION_NAME),
        where('username', '==', userData.username)
      );
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        throw new Error('Bu kullanıcı adı zaten kullanılıyor');
      }

      // Kullanıcı oluştur
      const { user: newUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Profil güncelle
      await updateProfile(newUser, {
        displayName: userData.username,
        photoURL: userData.photoURL
      });

      // Firestore dokümanı oluştur
      const userDoc = {
        uid: newUser.uid,
        email: newUser.email,
        username: userData.username,
        displayName: userData.displayName || userData.username,
        photoURL: userData.photoURL,
        role: USER_ROLES.USER,
        verifications: {},
        settings: {},
        createdAt: new Date(),
        lastLogin: new Date(),
        ...userData
      };

      await setDoc(doc(db, COLLECTION_NAME, newUser.uid), userDoc);

      // Email doğrulama gönder
      await sendEmailVerification(newUser);

      setUser(newUser);
      setProfile(userDoc);
      setIsAuthenticated(true);
      return userDoc;

    } catch (err) {
      console.error('Kayıt hatası:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auth, validateFields]);

  // Giriş yap
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const { user: loggedUser } = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Profil bilgilerini getir
      const profile = await fetchUserProfile(loggedUser.uid);

      // Son giriş zamanını güncelle
      await updateDoc(doc(db, COLLECTION_NAME, loggedUser.uid), {
        lastLogin: new Date()
      });

      setUser(loggedUser);
      setIsAuthenticated(true);
      return profile;

    } catch (err) {
      console.error('Giriş hatası:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auth, fetchUserProfile]);

  // Çıkış yap
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      localStorage.removeItem(`${CACHE_KEY}_${auth.currentUser?.uid}`);
    } catch (err) {
      console.error('Çıkış hatası:', err);
      setError(err.message);
      throw err;
    }
  }, [auth]);

  // Profil güncelle
  const updateUserProfile = useCallback(async (updates) => {
    if (!user) throw new Error('Kullanıcı girişi yapılmamış');
    setLoading(true);
    setError(null);

    try {
      const updateData = { ...updates };

      // Profil fotoğrafı yükleme
      if (updates.photoFile) {
        if (!ALLOWED_IMAGE_TYPES.includes(updates.photoFile.type)) {
          throw new Error('Desteklenmeyen dosya tipi');
        }
        if (updates.photoFile.size > MAX_PROFILE_IMAGE_SIZE) {
          throw new Error('Dosya boyutu çok büyük');
        }

        const photoRef = ref(storage, `profile_photos/${user.uid}`);
        await uploadBytes(photoRef, updates.photoFile);
        updateData.photoURL = await getDownloadURL(photoRef);
        delete updateData.photoFile;
      }

      // Firebase Auth güncelle
      if (updateData.displayName || updateData.photoURL) {
        await updateProfile(user, {
          displayName: updateData.displayName,
          photoURL: updateData.photoURL
        });
      }

      // Firestore güncelle
      await updateDoc(doc(db, COLLECTION_NAME, user.uid), {
        ...updateData,
        lastModified: new Date()
      });

      // Profili yeniden getir
      const updatedProfile = await fetchUserProfile(user.uid);
      return updatedProfile;

    } catch (err) {
      console.error('Profil güncelleme hatası:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, storage, fetchUserProfile]);

  // Email güncelle
  const updateUserEmail = useCallback(async (newEmail, password) => {
    if (!user) throw new Error('Kullanıcı girişi yapılmamış');
    setLoading(true);
    setError(null);

    try {
      // Yeniden kimlik doğrulama
      await signInWithEmailAndPassword(auth, user.email, password);
      
      // Email güncelle
      await updateEmail(user, newEmail);
      
      // Firestore güncelle
      await updateDoc(doc(db, COLLECTION_NAME, user.uid), {
        email: newEmail,
        lastModified: new Date()
      });

      // Email doğrulama gönder
      await sendEmailVerification(user);

      return true;
    } catch (err) {
      console.error('Email güncelleme hatası:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, auth]);

  // Şifre güncelle
  const updateUserPassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) throw new Error('Kullanıcı girişi yapılmamış');
    setLoading(true);
    setError(null);

    try {
      // Yeniden kimlik doğrulama
      await signInWithEmailAndPassword(auth, user.email, currentPassword);
      
      // Şifre güncelle
      await updatePassword(user, newPassword);
      return true;
    } catch (err) {
      console.error('Şifre güncelleme hatası:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, auth]);

  // Şifre sıfırlama
  const resetPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      console.error('Şifre sıfırlama hatası:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auth]);

  // Auth state değişikliklerini dinle
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      setIsAuthenticated(!!user);

      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, fetchUserProfile]);

  // Otomatik yenileme
  useEffect(() => {
    if (autoRefresh && user) {
      refreshTimeoutRef.current = setInterval(() => {
        fetchUserProfile(user.uid, true);
      }, refreshInterval);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, user, fetchUserProfile]);

  // Memoized değerler
  const userState = useMemo(() => ({
    isAuthenticated,
    isEmailVerified: user?.emailVerified || false,
    role: profile?.role || USER_ROLES.USER,
    verifications: profile?.verifications || {},
    metadata: profile?.metadata || {},
    stats: profile?.stats || {},
    lastLogin: profile?.lastLogin,
    createdAt: profile?.createdAt
  }), [user, profile, isAuthenticated]);

  return {
    user,
    profile,
    ...userState,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile: updateUserProfile,
    updateEmail: updateUserEmail,
    updatePassword: updateUserPassword,
    resetPassword,
    refresh: () => fetchUserProfile(user?.uid),
    lastFetch: lastFetchRef.current
  };
}; 