import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { userService } from '../../services/api.service';

const Profile = () => {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userService.getProfile();
        setProfile(response.data);
      } catch (err) {
        setError('Profil bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      await userService.updateProfile(profile);
      alert('Profil güncellendi.');
    } catch (err) {
      setError('Profil güncellenemedi.');
    }
  };

  if (loading) return <Typography>Yükleniyor...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Profil
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TextField
        label="Ad"
        fullWidth
        margin="normal"
        value={profile.name || ''}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
      />
      <TextField
        label="E-posta"
        fullWidth
        margin="normal"
        value={profile.email || ''}
        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
      />
      <Button variant="contained" color="primary" onClick={handleUpdateProfile}>
        Güncelle
      </Button>
    </Box>
  );
};

export default Profile; 