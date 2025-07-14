import * as React from 'react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Modal,
  Paper,
  Box,
  IconButton,
  Typography,
  TextField,
  Autocomplete,
  Button
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const backendBase = API_BASE_URL.replace(/\/$/, '');

export default function EditAmbil({
  open,
  onClose,
  data,
  purposes,
  initialOptions,
  onSave
}) {
  const [cartItems, setCartItems] = useState([]);
  const [editingQty, setEditingQty] = useState({});
  const [tanggalButuh, setTanggalButuh] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [initial, setInitial] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({ date: '', purpose: '', initial: '' });

  useEffect(() => {
    if (!data) return;
    setCartItems(data.items);
    const qtyMap = {};
    data.items.forEach(it => { qtyMap[it.id] = it.qty; });
    setEditingQty(qtyMap);
    if (data.date) {
      const dt = new Date(data.date);
      const pad = n => String(n).padStart(2, '0');
      const year  = dt.getFullYear();
      const month = pad(dt.getMonth() + 1);
      const day   = pad(dt.getDate());
      // const hour  = pad(dt.getHours());
      // const min   = pad(dt.getMinutes());
      const lokalISO = `${year}-${month}-${day}`;
      setTanggalButuh(lokalISO);
    } else {
      setTanggalButuh('');
    }
    setSelectedPurpose(purposes.find(p => p.name === data.purpose) || null);
    setInitial(data.initial);
    setDescription(data.description);
    setErrors({ date: '', purpose: '', initial: '' });
  }, [data, purposes]);

  const handleUpdateQuantity = (itemId, newQty) => {
    if (isNaN(newQty) || newQty < 1) return;
    setEditingQty(prev => ({ ...prev, [itemId]: newQty }));
    setCartItems(prev => prev.map(it => it.id === itemId ? { ...it, qty: newQty } : it));
  };

  const handleRemoveItem = id => {
    setCartItems(prev => prev.filter(it => it.id !== id));
  };

  const handleSubmit = async () => {
    const newErrors = { date: '', purpose: '', initial: '' };
    let hasError = false;
    if (!tanggalButuh) { newErrors.date = 'Tanggal harus diisi'; hasError = true; }
    if (!selectedPurpose) { newErrors.purpose = 'Kebutuhan harus dipilih'; hasError = true; }
    if (!initial) { newErrors.initial = 'Inisial harus dipilih'; hasError = true; }
    setErrors(newErrors);
    if (hasError) return;

    try {
      const payload = {
        checkout_date: `${tanggalButuh}:00`,
        purpose_id: selectedPurpose.id,
        user_initial: initial,
        description,
        items: cartItems.map(it => ({ id: it.id, checkout_quantity: editingQty[it.id] }))
      };
      await axios.put(`${API_BASE_URL}/api/checkouts/${data.id}`, payload);
      onClose();
      Swal.fire('Updated!', 'Data berhasil diubah.', 'success');
      onSave({
        ...data,
        date: tanggalButuh,
        purpose: selectedPurpose.name,
        initial,
        description,
        items: cartItems
      });
    } catch (err) {
      onClose();
      console.error(err);
      Swal.fire('Error', 'Gagal menyimpan perubahan.', 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.5)', p: 2 }}
    >
      <Paper elevation={3} sx={{ width: 500, height: '80vh', display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={onClose}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', mr: 1 }}>
            Edit Checkout
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 1, bgcolor: '#f5f5f5' }}>
          {cartItems.map(item => {
            const rawImage = item.product.image || '';
            const cleaned  = rawImage.replace(/^\//,'');
            let imgSrc;
            if (/^https?:\/\//i.test(cleaned)) {
              imgSrc = cleaned;
            } else if (cleaned.startsWith('images/')) {
              imgSrc = `${backendBase}/storage/${cleaned}`;
            } else {
              imgSrc = `${backendBase}/${cleaned}`;
            }

            return (
            <Paper key={item.id} variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 1 }}>
              <Box
                component="img"
                src={imgSrc}
                alt={item.product.name}
                onError={e => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${backendBase}/assets/images/default_product.jpg`;
                }}
                sx={{ width: 45, height: 45, ml: 2, mr: 2, objectFit: 'cover', borderRadius: 1 }}
              />  
              <Box sx={{ flexGrow: 1, ml: 6 }}>
                <Typography variant="subtitle2" fontWeight="bold">{item.product.name}</Typography>
                <Typography variant="caption">Stok : {item.product.stock}</Typography>
              </Box>
              <TextField
                size="small"
                type="number"
                value={editingQty[item.id] ?? ''}
                onChange={e => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) {
                    setEditingQty(prev => ({ ...prev, [item.id]: val }));
                  }
                }}
                onBlur={() => {
                  const raw = editingQty[item.id];
                  let num = parseInt(raw, 10);
                  if (isNaN(num) || num < 1) {
                    num = 1;
                  }
                  if (item.product.stock != null && num > item.product.stock) {
                    num = item.product.stock;
                    Swal.fire('Info', `Maksimal stok adalah ${item.product.stock}`, 'info');
                  }
                  setEditingQty(prev => ({ ...prev, [item.id]: num }));
                  handleUpdateQuantity(item.id, num);
                }}
                inputProps={{ min: 1 }}
                sx={{
                  width: 60,
                  mr: 8,
                  '& input[type=number]': {
                    MozAppearance: 'textfield',
                    appearance: 'textfield',
                  },
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'inner-spin-button',
                    opacity: 1,
                    display: 'block',
                  },
                }}
                InputProps={{
                  sx: { '& input': { textAlign: 'center', padding: '4px' } }
                }}
              />

              <IconButton onClick={() => handleRemoveItem(item.id)}>
                <HighlightOffIcon sx={{ color: '#DC2626' }} />
              </IconButton>
            </Paper>
            );
          })}

          <Box sx={{ mt: 1, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Tanggal Butuh</Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={tanggalButuh}
              onChange={e => { setTanggalButuh(e.target.value); setErrors(prev => ({ ...prev, date: '' })); }}
              error={!!errors.date}
              helperText={errors.date}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Kebutuhan</Typography>
            <Autocomplete
              options={purposes}
              getOptionLabel={opt => opt.name}
              value={selectedPurpose}
              onChange={(_, val) => { setSelectedPurpose(val); setErrors(prev => ({ ...prev, purpose: '' })); }}
              disablePortal
              fullWidth
              size="small"
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder="Pilih kebutuhan"
                  error={!!errors.purpose}
                  helperText={errors.purpose}
                />
              )}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Inisial</Typography>
            <Autocomplete
              options={initialOptions}
              getOptionLabel={opt => opt}
              value={initial}
              onChange={(_, val) => { setInitial(val || ''); setErrors(prev => ({ ...prev, initial: '' })); }}
              disablePortal
              fullWidth
              size="small"
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder="Pilih inisial"
                  error={!!errors.initial}
                  helperText={errors.initial}
                />
              )}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Catatan</Typography>
            <TextField fullWidth size="small" multiline rows={3} value={description} onChange={e => setDescription(e.target.value)} />
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: 2, mr: 1 }}>
          <Button variant="outlined" onClick={onClose} sx={{ textTransform: 'capitalize' }}>Batal</Button>
          <Button variant="contained" onClick={handleSubmit} sx={{ textTransform: 'capitalize' }} startIcon={<AddIcon />}>Simpan</Button>
        </Box>
      </Paper>
    </Modal>
  );
}

EditAmbil.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
  purposes: PropTypes.array.isRequired,
  initialOptions: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired
};
