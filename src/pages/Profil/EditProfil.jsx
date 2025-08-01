import React, { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  MenuItem
} from '@mui/material';
import Swal from 'sweetalert2';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function EditProfil({ open, userId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nip: '',
    position: '',
    initial: '',
    role: '',
    study_program_id: '',
    phone_number: ''
  });
  const [studyPrograms, setStudyPrograms] = useState([]);

  useEffect(() => {
    if (open && userId) {
      fetchStudyPrograms();
      fetchUser();
    }
  }, [open, userId]);

  const token = `${localStorage.getItem('token_type')} ${localStorage.getItem('access_token')}`;
  const ngrokHeader = { 'ngrok-skip-browser-warning': 'true' };

  const fetchStudyPrograms = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/study-programs`,
        { headers: { Accept: 'application/json', ...ngrokHeader } }
      );
      console.log('StudyPrograms response:', res.data);
      const list = res.data?.data?.data ?? res.data?.data ?? [];
      setStudyPrograms(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching study programs:', err);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/users/${userId}`,
        { headers: { Accept: 'application/json', Authorization: token, ...ngrokHeader } }
      );
      console.log('fetchUser response:', res.data);
      const payload = res.data.data;
      const user = payload?.id
        ? payload
        : Array.isArray(payload?.data) && payload.data.length
          ? payload.data[0]
          : {};
      setFormData({
        name: user.name || '',
        email: user.email || '',
        nip: user.nip || '',
        position: user.position || '',
        initial: user.initial || '',
        role: user.role || '',
        study_program_id: user.study_program_id || '',
        phone_number: user.phone_number || ''
      });
    } catch (err) {
      console.error('Fetch user error:', err);
      Swal.fire('Error', 'Gagal mengambil data profil.', 'error');
      onClose();
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };
    if (name === 'position') {
      updated.role = 'Staff';
      updated.study_program_id = '';
      if (value !== 'Rumah Tangga') updated.phone_number = '';
    }
    setFormData(updated);
  };

  const handleSave = async () => {
    const { name, email, nip, initial, position, study_program_id, phone_number, role } = formData;
    if (!name || !email || !nip || !initial) {
      Swal.fire('Error', 'Semua kolom harus diisi.', 'error');
      return;
    }
    try {
      const url = role.toLowerCase() === 'kabag'
        ? `${API_BASE_URL}/api/users`
        : `${API_BASE_URL}/api/users/${userId}`;
      await axios({
        url,
        method: 'patch',
        data: {
          name,
          email,
          nip,
          initial,
          position,
          role,
          study_program_id: position === 'Dosen' ? study_program_id : null,
          phone_number: position === 'Rumah Tangga' ? phone_number : null
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: token,
          ...ngrokHeader,
          'X-HTTP-Method-Override': 'PATCH'
        }
      });
      Swal.fire('Berhasil', 'Profil berhasil diperbarui.', 'success').then(onSuccess);
      onClose();
    } catch (err) {
      onClose();
      console.error('Update error:', err);
      Swal.fire('Error', 'Gagal memperbarui profil.', 'error');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        maxWidth: 400, mx: "auto", bgcolor: "white", p: 4, borderRadius: 2, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      }}>
        <Typography variant="h6" align="center" sx={{ mb: 2 }}>Ubah Data Diri</Typography>
        <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Nama
            </Typography>
            <TextField name="name" value={formData.name} onChange={handleChange} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Email
            </Typography>
            <TextField name="email" value={formData.email} onChange={handleChange} fullWidth size="small" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              NIP
            </Typography>
            <TextField name="nip" value={formData.nip} onChange={handleChange} fullWidth size="small" />
          </Grid>
          {/* <Grid size={{ xs: 12 }}> */}
            {/* <Typography variant="body1" sx={{ mb: 1 }}>
              Posisi
            </Typography> */}
            {/* <TextField name="position" value={formData.position} onChange={handleChange} select fullWidth size="small">
              <MenuItem value="Dosen">Dosen</MenuItem>
              <MenuItem value="Rumah Tangga">Rumah Tangga</MenuItem>
              <MenuItem value="Tendik">Tendik</MenuItem>
              <MenuItem value="Kabag">Kabag</MenuItem>
            </TextField> */}
          {/* </Grid> */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Inisial
            </Typography>
            <TextField name="initial" value={formData.initial} onChange={handleChange} fullWidth size="small" />
          </Grid>
          {formData.position === 'Dosen' && (
            <Grid size={{ xs: 12 }}>
              <TextField label="Program Studi" name="study_program_id" value={formData.study_program_id} onChange={handleChange} select fullWidth size="small">
                {studyPrograms.map(prog => <MenuItem key={prog.id} value={prog.id}>{prog.name}</MenuItem>)}
              </TextField>
            </Grid>
          )}
          {formData.position === 'Rumah Tangga' && (
            <Grid size={{ xs: 12 }}>
              <TextField label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} fullWidth size="small" placeholder="08xxxxxxxxxx" />
            </Grid>
          )}
        </Grid>
        </Box>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button variant="contained" onClick={handleSave}>Simpan</Button>
          <Button sx={{ ml: 2, bgcolor: '#E4E6EF', color: 'black' }} onClick={onClose}>Tutup</Button>
        </Box>
      </Box>
    </Modal>
  );
}
