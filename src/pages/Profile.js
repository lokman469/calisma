import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Box,
  Divider,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useUser } from '../context/UserContext';

function Profile() {
  const { user, updateUser } = useUser();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(formData);
      setEditing(false);
      setSnackbar({
        open: true,
        message: 'Profil başarıyla güncellendi',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Profil güncellenirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{ width: 100, height: 100, mr: 2 }}
            src={user?.avatar}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              {user?.name || 'Kullanıcı Adı'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Üyelik Tarihi: {new Date(user?.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <IconButton onClick={() => setEditing(!editing)}>
            {editing ? <SaveIcon /> : <EditIcon />}
          </IconButton>
        </Box>

        <Divider sx={{ my: 3 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ad Soyad"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!editing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-posta"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefon"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!editing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hakkımda"
                name="bio"
                multiline
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                disabled={!editing}
              />
            </Grid>
            {editing && (
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  type="submit"
                  startIcon={<SaveIcon />}
                >
                  Değişiklikleri Kaydet
                </Button>
              </Grid>
            )}
          </Grid>
        </form>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}

export default Profile; 