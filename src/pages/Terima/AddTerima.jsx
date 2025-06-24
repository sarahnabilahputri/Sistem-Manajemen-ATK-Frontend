import * as React from 'react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Modal, Paper, Box, Typography, TextField, Button,
  Autocomplete, CircularProgress
} from '@mui/material';
import Swal from 'sweetalert2';

const BASE_URL = 'https://boar-lenient-similarly.ngrok-free.app';
const REORDERS_URL = `${BASE_URL}/api/reorders`;
const RECEIVED_URL = `${BASE_URL}/api/product-received`;

const getToday = () => {
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
};

export default function AddTerima({ CloseEvent, onSuccess }) {
  const [reorders, setReorders] = useState([]);
  const [loadingReorders, setLoadingReorders] = useState(false);
  const [selectedReorder, setSelectedReorder] = useState(null);
  const [items, setItems] = useState([]);
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [receivedPrices, setReceivedPrices] = useState({});
  const [receivedDate, setReceivedDate] = useState(getToday());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoadingReorders(true);
    axios.get(REORDERS_URL, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then(res => {
        const proses = (res.data.data || []).filter(r => r.reorder_status === 'proses');
        setReorders(proses);
      })
      .catch(() => Swal.fire('Error', 'Gagal memuat daftar pesanan.', 'error'))
      .finally(() => setLoadingReorders(false));
  }, []);

  useEffect(() => {
    if (!selectedReorder) {
      setItems([]);
      setReceivedQuantities({});
      setReceivedPrices({});
      return;
    }
    const its = selectedReorder.items || [];
    setItems(its);
    const initQty = {}, initPrice = {};
    its.forEach(it => {
      initQty[it.product_id] = it.reorder_quantity;
      initPrice[it.product_id] = it.product.price;
    });
    setReceivedQuantities(initQty);
    setReceivedPrices(initPrice);
  }, [selectedReorder]);

  const validate = () => {
    const err = {};
    if (!receivedDate) err.date = 'Pilih tanggal penerimaan';
    if (!selectedReorder) err.reorder = 'Pilih kode pesanan';
    items.forEach((it, idx) => {
      const q = parseInt(receivedQuantities[it.product_id], 10) || 0;
      if (q < 1 || q > it.reorder_quantity) err[`qty_${idx}`] = 'Jumlah tidak valid';
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!selectedReorder) return;
    setSubmitting(true);
    try {
      const respCheck = await axios.get(RECEIVED_URL, {
        params: { reorder_id: selectedReorder.id },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const existing = respCheck.data.data?.data || [];
      if (existing.length > 0) {
        CloseEvent();
        Swal.fire('Info', 'Pemesanan dengan kode ini sudah dimasukkan penerimaannya.', 'info');
        setSubmitting(false);
        return;
      }
    } catch (e) {
      console.error('Error checking existing penerimaan:', e);
      Swal.fire('Error', 'Gagal memeriksa data penerimaan sebelumnya.', 'error');
      setSubmitting(false);
      return;
    }

    const [yr, mo, da] = receivedDate.split('-');
    const payload = {
      reorder_id: selectedReorder.id,
      received_date: `${da}-${mo}-${yr}`,
      products: items.map(it => ({
        product_id: it.product_id,
        received_quantity: parseInt(receivedQuantities[it.product_id], 10) || 0,
        price: receivedPrices[it.product_id] || 0
      }))
    };
    try {
      await axios.post(RECEIVED_URL, payload, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      CloseEvent();
      onSuccess();
      Swal.fire('Success', 'Penerimaan berhasil disimpan.', 'success');
    } catch (e) {
      console.error('Error saving penerimaan:', e);
      Swal.fire('Error', e.response?.data?.message || 'Gagal simpan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={CloseEvent} BackdropProps={{ sx:{ bgcolor:'rgba(0,0,0,0.2)' } }} sx={{ display:'flex', alignItems:'center', justifyContent:'center', p:2 }}>
      <Paper sx={{ width:500, maxHeight:'80vh', display:'flex', flexDirection:'column', borderRadius:2, overflow:'hidden' }}>
        <Box sx={{ p:2, borderBottom:'1px solid #ddd' }}><Typography variant='h6' align='center'>Tambah Penerimaan</Typography></Box>
        <Box sx={{ flex:1, overflowY:'auto', p:2, bgcolor:'#f5f5f5' }}>

          {/* Tanggal diterima */}
          <Box sx={{ mb:2, bgcolor:'white', p:2, borderRadius:1 }}>
            <Typography variant='subtitle2' sx={{ mb:1 }}>Tanggal Diterima</Typography>
            <TextField
              type='date' fullWidth size='small' InputLabelProps={{ shrink:true }}
              value={receivedDate} onChange={e => setReceivedDate(e.target.value)}
              error={!!errors.date} helperText={errors.date}
            />
          
            <Typography variant='subtitle2' sx={{ mb:1, mt:2 }}>Kode Pesanan</Typography>
            <Autocomplete
              options={reorders}
              value={selectedReorder}
              isOptionEqualToValue={(o,v)=>o.id===v?.id}
              getOptionLabel={o=>o.reorder_code||''}
              loading={loadingReorders}
              onChange={(_,v)=>setSelectedReorder(v)}
              renderInput={params=>(
                <TextField {...params} size='small' fullWidth
                  error={!!errors.reorder} helperText={errors.reorder}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment:(<>{loadingReorders&&<CircularProgress size={20}/>} {params.InputProps.endAdornment}</>)
                  }}
                />)}
            />
          </Box>

          {/* Items list */}
          {items.map((it, idx) => {
            const qty = parseInt(receivedQuantities[it.product_id], 10) || 0;
            const unitPrice = receivedPrices[it.product_id] || 0;
            const totalPrice = qty * unitPrice;
            return (
              <Paper key={it.product_id} variant='outlined' sx={{ display:'flex', alignItems:'center', p:2, my:1, bgcolor:'white' }}>
                <Box component='img' src={(/^https?:\/\//.test(it.product.image)?it.product.image:`${BASE_URL}/${it.product.image.replace(/^\//,'')}`)}
                  onError={e=>e.currentTarget.src=`${BASE_URL}/assets/images/default_product.jpg`}
                  sx={{width:45,height:45,mr:2,objectFit:'cover',borderRadius:1}}/>
                <Box sx={{ flex:1, ml:1 }}>
                  <Typography variant='subtitle2' fontWeight='bold' noWrap>{it.product.name}</Typography>
                  <Typography variant='caption'>Dipesan: {it.reorder_quantity}</Typography>
                </Box>

                {/* Quantity input */}
                <TextField
                  size="small"
                  type="number"
                  value={receivedQuantities[it.product_id] ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      setReceivedQuantities(prev => ({ ...prev, [it.product_id]: val }));
                    }
                  }}
                  onBlur={() => {
                    let num = parseInt(receivedQuantities[it.product_id], 10);
                    if (isNaN(num) || num < 1) num = 1;
                    if (num > it.reorder_quantity) {
                      num = it.reorder_quantity;
                      Swal.fire('Info', `Maksimal stok adalah ${it.reorder_quantity}`, 'info');
                    }
                    setReceivedQuantities(prev => ({ ...prev, [it.product_id]: num }));
                  }}
                  inputProps={{ min: 1, max: it.reorder_quantity }}
                  sx={{
                    width: 60,
                    mr: 7,
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
                  InputProps={{ sx: { '& input': { textAlign: 'center', padding: '4px' } } }}
                  error={!!errors[`qty_${idx}`]}
                  helperText={errors[`qty_${idx}`]}
                />

                {/* Total label and price */}
                <Box sx={{ textAlign: 'left', width: 100 }}>
                  <Typography variant='caption'>Total:</Typography>
                  <Typography variant='subtitle2'>
                    {totalPrice.toLocaleString('id-ID', {
                      style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0
                    })}
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>
        <Box sx={{ p:2, borderTop:'1px solid #ddd', display:'flex', justifyContent:'flex-end', gap:2 }}>
          <Button variant='contained' color='error' onClick={CloseEvent} disabled={submitting}>Batal</Button>
          <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Simpan'}
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
}

AddTerima.propTypes = { CloseEvent: PropTypes.func.isRequired, onSuccess: PropTypes.func.isRequired };
