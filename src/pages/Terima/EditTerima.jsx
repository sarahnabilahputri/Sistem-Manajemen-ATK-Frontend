import * as React from 'react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Modal,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import Swal from 'sweetalert2';
import InputAdornment from '@mui/material/InputAdornment';

const BASE_URL = import.meta.env.VITE_BASE_URL.replace(/\/$/, '');

export default function EditTerima({ CloseEvent, formData, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [receivedDate, setReceivedDate] = useState('');
  const [reorderCode, setReorderCode] = useState('');
  const [reorderDate, setReorderDate] = useState(null);
  const [items, setItems] = useState([]);
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [receivedPrices, setReceivedPrices] = useState({});
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!formData || !formData.id) return;
    const fetchDetail = async () => {
      try {
        const resp = await axios.get(`${BASE_URL}/api/product-received/${formData.id}`, {
          headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        const data = resp.data.data;
        const rawDate = data.received_date;
        let dateForInput = '';
        if (rawDate) {
          const [y, m, d] = rawDate.split('-');
          if (y && m && d) dateForInput = `${y.padStart(4,'0')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        }
        setReceivedDate(dateForInput);
        setStatus(data.received_status || '');
        setReorderCode(data.reorder?.reorder_code || formData.reorderId || '');
        if (data.reorder && data.reorder.reorder_date) {
          setReorderDate(data.reorder.reorder_date);
        }
        let reorderItems = [];
        if (data.reorder && data.reorder.id) {
          try {
            const rep = await axios.get(`${BASE_URL}/api/reorders/${data.reorder.id}`, {
              headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' }
            });
            const rdata = rep.data.data;
            reorderItems = rdata.items || [];
          } catch (err) {
            console.error('Error fetching reorder detail:', err);
          }
        }
        const details = data.details || [];
        const combined = reorderItems.map(rIt => {
          const detail = details.find(d => d.product_id === rIt.product_id) || {};
          const unitPrice = (typeof detail.price === 'number' && detail.price > 0)
            ? detail.price
            : rIt.product.price;
          return {
            product: rIt.product,
            reorder_quantity: rIt.reorder_quantity,
            received_quantity: detail.received_quantity ?? 0,
            price: unitPrice,
          };
        });
        setItems(combined);
        const initQty = {};
        const initPrice = {};
        combined.forEach(item => {
          initQty[item.product.id] = item.received_quantity;
          initPrice[item.product.id] = item.price;
        });
        setReceivedQuantities(initQty);
        setReceivedPrices(initPrice);
      } catch (err) {
        console.error('Error fetching detail:', err);
        Swal.fire('Error', 'Gagal mengambil detail penerimaan.', 'error');
        CloseEvent();
      }
    };
    fetchDetail();
  }, [formData.id]);

  const validate = () => {
    const err = {};
    if (!receivedDate) {
      err.date = 'Pilih tanggal penerimaan';
    } else if (reorderDate) {
      const [yrI, moI, daI] = receivedDate.split('-');
      const dateObj = new Date(yrI, moI - 1, daI);
      const [dR, mR, yR] = reorderDate.split('-');
      const reorderObj = new Date(yR, mR - 1, dR);
      if (dateObj < reorderObj) {
        err.date = 'Tanggal diterima tidak boleh lebih kecil dari tanggal permintaan';
      }
    }
    items.forEach((it) => {
      const pid = it.product.id;
      const q = parseInt(receivedQuantities[pid], 10);
      if (isNaN(q) || q < 0 || q > it.reorder_quantity) {
        err[`qty_${pid}`] = 'Jumlah tidak valid';
      }
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (status !== 'pending') {
      Swal.fire('Info', 'Hanya penerimaan dengan status pending yang bisa diupdate.', 'info');
      return;
    }
    if (!validate()) return;
    setLoading(true);
    const [yr, mo, da] = receivedDate.split('-');
    const payload = {
      reorder_id: formData.reorderId,
      received_date: `${da}-${mo}-${yr}`,
      products: items.map(it => ({
        product_id: it.product.id,
        received_quantity: parseInt(receivedQuantities[it.product.id], 10),
        price: receivedPrices[it.product.id],
      })),
    };
    try {
      const resp = await axios.patch(`${BASE_URL}/api/product-received/${formData.id}`, payload, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      console.log('Response patch:', resp.data);
      payload.products.forEach(p => {
        setReceivedQuantities(prev => ({
          ...prev,
          [p.product_id]: p.received_quantity
        }));
        const it = items.find(i => i.product.id === p.product_id);
        const unitPrice = (typeof p.price === 'number' && p.price > 0)
          ? p.price
          : (it ? it.product.price : 0);
        setReceivedPrices(prev => ({
          ...prev,
          [p.product_id]: unitPrice
        }));
      });
      Swal.fire('Success', 'Jumlah penerimaan berhasil diperbarui.', 'success');
      onSuccess();
    } catch (e) {
      console.error('Error updating:', e);
      if (e.response?.status === 422) {
        const data = e.response.data;
        if (data.errors) {
          const fieldErr = {};
          Object.entries(data.errors).forEach(([field, msgs]) => {
            fieldErr['form'] = msgs.join(' ');
          });
          setErrors(fieldErr);
        }
        Swal.fire('Error', e.response.data.message || 'Validasi gagal.', 'error');
      } else {
        Swal.fire('Error', 'Gagal mengupdate penerimaan.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (pid, val) => {
    if (/^\d*$/.test(val)) {
      setReceivedQuantities(prev => ({ ...prev, [pid]: val }));
    }
  };
  const handleQtyBlur = (it) => {
    const pid = it.product.id;
    let num = parseInt(receivedQuantities[pid], 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > it.reorder_quantity) {
      num = it.reorder_quantity;
      Swal.fire('Info', `Maksimal stok adalah ${it.reorder_quantity}`, 'info');
    }
    setReceivedQuantities(prev => ({ ...prev, [pid]: num }));
  };

  return (
    <Modal open onClose={CloseEvent} BackdropProps={{ sx:{ bgcolor:'rgba(0,0,0,0.2)' } }} sx={{ display:'flex', alignItems:'center', justifyContent:'center', p:2 }}>
      <Paper sx={{ width:550, maxHeight:'80vh', display:'flex', flexDirection:'column', borderRadius:2, overflow:'hidden' }}>
        <Box sx={{ p:2, borderBottom:'1px solid #ddd' }}>
          <Typography variant='h6' align='center'>Edit Penerimaan</Typography>
        </Box>
        <Box sx={{ flex:1, overflowY:'auto', p:2, bgcolor:'#f5f5f5' }}>
          {/* Tanggal diterima */}
          <Box sx={{ mb:2, bgcolor:'white', p:2, borderRadius:1 }}>
            <Typography variant='subtitle2' sx={{ mb:1 }}>Tanggal Diterima</Typography>
            <TextField
              type='date' fullWidth size='small' InputLabelProps={{ shrink:true }}
              value={receivedDate} onChange={e => setReceivedDate(e.target.value)}
              error={!!errors.date} helperText={errors.date}
            />
            <Typography variant='subtitle2' sx={{ mt:2, mb:1 }}>Kode Pesanan</Typography>
            <TextField fullWidth size='small' value={reorderCode} disabled />
            {errors.form && (
              <Typography color="error" variant="caption">{errors.form}</Typography>
            )}
          </Box>
          {items.map((it) => {
            const pid = it.product.id;
            const imgSrc = (/^https?:\/\//.test(it.product.image) ? it.product.image : `${BASE_URL}/${it.product.image.replace(/^\//,'')}`);
            const qty = parseInt(receivedQuantities[pid], 10) || 0;
            const price = parseInt(receivedPrices[pid], 10) || it.product.price;
            const total = qty * price;
            return (
              <Paper key={pid} variant='outlined' sx={{ display:'flex', alignItems:'center', p:2, my:1, bgcolor:'white' }}>
                <Box component='img' src={imgSrc}
                  onError={e=>e.currentTarget.src=`${BASE_URL}/assets/images/default_product.jpg`}
                  sx={{width:45,height:45,mr:2,objectFit:'cover',borderRadius:1}}/>
                <Box sx={{ flex:1, ml:1 }}>
                  <Typography variant='subtitle2' fontWeight='bold' noWrap>{it.product.name}</Typography>
                  <Typography variant='caption'>Dipesan: {it.reorder_quantity}</Typography>
                </Box>
                <Box sx={{ textAlign: 'left', width: 100, mr: 2 }}>
                <Typography variant='caption'>Jumlah:</Typography>
                <TextField
                  size="small"
                  type="number"
                  value={receivedQuantities[pid] ?? ''}
                  onChange={e => handleQtyChange(pid, e.target.value)}
                  onBlur={() => handleQtyBlur(it)}
                  inputProps={{ min: 0, max: it.reorder_quantity }}
                  sx={{
                    width: 60,
                    mr: 7,
                    mt: 0.5,
                    '& input[type=number]': { appearance: 'textfield' },
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'inner-spin-button', opacity: 1, display: 'block'
                    },
                  }}
                  InputProps={{ sx: { '& input': { textAlign: 'center', padding: '4px' } } }}
                  error={!!errors[`qty_${pid}`]} helperText={errors[`qty_${pid}`]}
                />  
                </Box>
                <Box sx={{ textAlign: 'left', width: 120, mr: 4 }}>
                  <Typography variant='caption'>Harga Satuan:</Typography>
                  <TextField
                    size="small"
                    type="text"
                    value={price.toLocaleString('id-ID')}
                    onChange={e => {
                      const num = e.target.value.replace(/\D/g, '');
                      setReceivedPrices(prev => ({ ...prev, [pid]: num }));
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                      sx: { '& input': { textAlign: 'left', padding: '4px' } }
                    }}
                    sx={{ 
                      width: 150, 
                      mt: 0.5,
                      '& .MuiOutlinedInput-root': {
                        height: 36,
                        '& .MuiOutlinedInput-input': {
                          padding: '8px 12px',
                        }
                      } 
                    }}
                  />
                </Box>
              </Paper>
            );
          })}
        </Box>
        <Box sx={{ p:2, borderTop:'1px solid #ddd', display:'flex', justifyContent:'flex-end', gap:2 }}>
          <Button variant='contained' color='error' onClick={CloseEvent}>Batal</Button>
          <Button variant='contained' onClick={handleSubmit} disabled={loading || status!=='pending'}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Simpan'}
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
}

EditTerima.propTypes = {
  CloseEvent: PropTypes.func.isRequired,
  formData: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};
