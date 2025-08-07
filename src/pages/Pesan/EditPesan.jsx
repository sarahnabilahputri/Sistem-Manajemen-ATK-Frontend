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
  Button
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Swal from 'sweetalert2';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const backendBase = API_BASE_URL.replace(/\/$/, '');

export default function EditPesan({ open, onClose, data, onSave, onDelete }) {
  const [items, setItems] = useState([]);
  const [initialItems, setInitialItems] = useState([]);
  const [editingQty, setEditingQty] = useState({});
  const [reorderDate, setReorderDate] = useState('');
  const [initialReorderDate, setInitialReorderDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [errors, setErrors] = useState({ deliveryDate: '' });

  useEffect(() => {
    if (!data) return;
    const its = data.items || [];
    setItems(its);
    setInitialItems(its);
    const map = {};
    its.forEach(it => { map[it.id] = it.reorder_quantity; });
    setEditingQty(map);
    if (data.reorder_date) {
      const dt = new Date(data.reorder_date);
      const pad = n => String(n).padStart(2, '0');
      const year = dt.getFullYear();
      const month = pad(dt.getMonth() + 1);
      const day = pad(dt.getDate());
      const iso = `${year}-${month}-${day}`;
      setReorderDate(iso);
      setInitialReorderDate(iso);
    } else {
      setReorderDate(''); setInitialReorderDate('');
    }
    if (data.delivery_date) {
      const dt2 = new Date(data.delivery_date);
      const pad = n => String(n).padStart(2, '0');
      const year2 = dt2.getFullYear();
      const month2 = pad(dt2.getMonth() + 1);
      const day2 = pad(dt2.getDate());
      setDeliveryDate(`${year2}-${month2}-${day2}`);
    } else setDeliveryDate('');
    setErrors({ deliveryDate: '' });
  }, [data]);

  const handleUpdateQuantity = (itemId, newQty) => {
    if (isNaN(newQty) || newQty < 1) return;
    setEditingQty(prev => ({ ...prev, [itemId]: newQty }));
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, reorder_quantity: newQty } : it));
  };
  const handleRemoveItem = id => {
    const newItems = items.filter(it => it.id !== id);
    setItems(newItems);
    const copy = { ...editingQty }; delete copy[id]; setEditingQty(copy);
  };

  const validate = () => {
    const newErr = { deliveryDate: '' };
    let hasError = false;
    if (items.length > 0) {
      if (!deliveryDate) { newErr.deliveryDate = 'Tanggal pengiriman wajib diisi'; hasError = true; }
      if (reorderDate && deliveryDate) {
        const rd = new Date(reorderDate);
        const dd = new Date(deliveryDate);
        if (dd < rd) { newErr.deliveryDate = 'Tanggal pengiriman harus sama atau setelah tanggal pesanan'; hasError = true; }
      }
    }
    setErrors(newErr);
    return !hasError;
  };

  const restoreOnCancel = () => {
    setItems(initialItems);
    const map = {};
    initialItems.forEach(it => { map[it.id] = it.reorder_quantity; });
    setEditingQty(map);
    setReorderDate(initialReorderDate);
    if (data.delivery_date) {
      const dt2 = new Date(data.delivery_date);
      const pad = n => String(n).padStart(2, '0');
      const year2 = dt2.getFullYear();
      const month2 = pad(dt2.getMonth() + 1);
      const day2 = pad(dt2.getDate());
      setDeliveryDate(`${year2}-${month2}-${day2}`);
    } else setDeliveryDate('');
    setErrors({ deliveryDate: '' });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const [yr, mo, da] = deliveryDate.split('-');
    const formattedDelivery = `${da}-${mo}-${yr}`;
    const detailsPayload = items.map(it => ({
      product_id: it.product.id,
      reorder_quantity: parseInt(editingQty[it.id], 10) || it.reorder_quantity
    }));
    const payload = {
      delivery_date: `${da}-${mo}-${yr}`,
      details: detailsPayload
    };

    try {
      onClose();
      const res = await axios.put(
        `${API_BASE_URL}/api/reorders/${data.id}`,
        payload,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      Swal.close();
      Swal.fire('Berhasil!', 'Data pemesanan berhasil diubah.', 'success');

      const updated = res.data.data;
      onSave({
        id: updated.id,
        created_at: updated.created_at,
        reorder_date: updated.reorder_date,
        delivery_date: updated.delivery_date,
        total_reorder_price: updated.total_reorder_price,
        whatsapp_status: updated.whatsapp_status,
        reorder_status: updated.reorder_status,
        items: updated.items,
        sent_at: updated.sent_at,
        cancelled_at: updated.cancelled_at,
        user_id: updated.user_id,
        initial: data.initial,
      });
    } catch (err) {
      Swal.close();
      Swal.fire('Error', err.response?.data?.message || 'Gagal menyimpan perubahan.', 'error');
      restoreOnCancel();
    }
  };

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const totalReorderPrice = items.reduce((sum, it) => { const qty = parseInt(editingQty[it.id], 10) || it.reorder_quantity; return sum + (it.product.price * qty); }, 0);

  return (
    <Modal
      open={open}
      onClose={() => { restoreOnCancel(); onClose(); }}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.5)', p: 2 }}
    >
      <Paper elevation={3} sx={{ width: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => { restoreOnCancel(); onClose(); }}><ArrowBackIosNewIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', mr: 1 }}>Edit Pemesanan</Typography>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
          {items.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" color="text.secondary">Tidak ada item. Jika disimpan, maka reorder akan dihapus.</Typography>
            </Box>
          ) : items.map(item => {
            const rawImage = item.product.image || '';
            const cleaned = rawImage.replace(/^\//, '');
            let imgSrc;
            if (/^https?:\/\//i.test(cleaned)) imgSrc = cleaned;
            else if (cleaned.startsWith('images/')) imgSrc = `${backendBase}/storage/${cleaned}`;
            else imgSrc = `${backendBase}/${cleaned}`;
            return (
              <Paper key={item.id} variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 1 }}>
                <Box
                  component="img"
                  src={imgSrc}
                  alt={item.product.name}
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `${backendBase}/assets/images/default_product.jpg`; }}
                  sx={{ width: 45, height: 45, ml: 2, mr: 2, objectFit: 'cover', borderRadius: 1 }}
                />
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', ml: 3 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ mb: 0.5 }}>{item.product.name}</Typography>
                    <Typography variant="caption" display="block" gutterBottom sx={{ mb: 0.5 }}>Stok: {item.product.stock}</Typography>
                    <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                      Total: {formatter.format(item.product.price * (parseInt(editingQty[item.id],10) || item.reorder_quantity))}
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    type="number"
                    value={editingQty[item.id] || ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        setEditingQty(prev => ({ ...prev, [item.id]: val }));
                      }
                    }}
                    onBlur={() => {
                      let num = parseInt(editingQty[item.id], 10);
                      if (isNaN(num) || num < 1) num = 1;
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
                  <IconButton size="small" onClick={() => handleRemoveItem(item.id)}>
                    <HighlightOffIcon sx={{ color: '#DC2626' }} fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            );
          })}
          <Box sx={{ mt: 1, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Tanggal Pemesanan</Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={reorderDate}
              disabled
              sx={{ mb: 2 }}
            />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Tanggal Pengiriman</Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={deliveryDate}
              onChange={e => { setDeliveryDate(e.target.value); setErrors(prev => ({ ...prev, deliveryDate: '' })); }}
              error={Boolean(errors.deliveryDate)}
              helperText={errors.deliveryDate}
              inputProps={{ min: reorderDate }}
              sx={{ mb: 0 }}
              disabled={items.length === 0}
            />
          </Box>
          <Box sx={{ mt: 1, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="subtitle1">Total Harga :</Typography>
            <Typography variant="h6" fontWeight="bold">
              {items.length === 0 ? '-' : formatter.format(totalReorderPrice)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ p: 2, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: 2, mr: 1 }}>
          <Button variant="contained" color="error" onClick={() => { restoreOnCancel(); onClose(); }} sx={{ textTransform: 'capitalize' }}>Batal</Button>
          <Button variant="contained" onClick={handleSubmit} sx={{ textTransform: 'capitalize' }}>Simpan</Button>
        </Box>
      </Paper>
    </Modal>
  );
}

EditPesan.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
