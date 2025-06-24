import React from 'react';
import { Box, Paper, Typography, Button, Divider, Avatar, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';

const getUserFromStorage = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error parsing user data', err);
    return null;
  }
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = getUserFromStorage();

  const handleEdit = () => {
    if (!user) return;
    const role = (user.role || '').toLowerCase();
    if (role === 'baak') {
      navigate('/user');
    } else if (role === 'staff') {
      navigate('/staf');
    } else {
      navigate('/profile/edit');
    }
  };

  return (
    <Box sx={{ mx: 'auto', mt: 4}}>
      <Paper elevation={1} sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 2 }}>
        <Avatar
          src={user?.avatar || '/profile.jpeg'}
          alt={user?.name || ''}
          sx={{ width: 100, height: 100, mr: 5, ml:5 }}
          onError={(e) => { e.target.src = '/profile.jpeg'; }}
        />
        <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
          {user?.name || 'Nama Pengguna'}
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Detail Profil
          </Typography>
          <Button variant="contained" onClick={handleEdit} startIcon={<EditIcon />}sx={{textTransform: 'capitalize'}}>
            Ubah Data Diri
          </Button>
        </Box>
        <Divider />

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Nama Lengkap
            </Typography>
          </Grid>
          <Grid size={{ xs: 8 }}>
            <Typography variant="body2">
              {user?.name || '-'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Inisial Nama
            </Typography>
          </Grid>
          <Grid size={{ xs: 8 }}>
            <Typography variant="body2">
              {user?.initial || '-'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Email Instansi
            </Typography>
          </Grid>
          <Grid size={{ xs: 8 }}>
            <Typography variant="body2">
              {user?.email || '-'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Jabatan
            </Typography>
          </Grid>
          <Grid size={{ xs: 8 }}>
            <Typography variant="body2">
              {user?.position || '-'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Role
            </Typography>
          </Grid>
          <Grid size={{ xs: 8 }}>
            <Typography variant="body2">
              {user?.role || '-'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
