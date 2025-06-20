import React, { useState, useEffect } from 'react';
import {
  Modal, Box, Paper, Typography,
  IconButton, TextField, Button, Divider
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { useCart } from '../context/CartContext'; // sesuaikan path
import Swal from 'sweetalert2';

export default function CartModal() {
  const {
    items: cartItems,
    isCartOpen,
    closeCart,
    updateCartItem,
    removeCartItem,
    checkout,
  } = useCart();

  // State tanggal & quantity edit
  const [reorderDate, setReorderDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [dateErrors, setDateErrors] = useState({});
  const [editingQty, setEditingQty] = useState({});
  const [qtyErrors, setQtyErrors] = useState({});

  // Ambil base URL backend dari env, tanpa trailing slash
  const backendBase = import.meta.env.VITE_BASE_URL?.replace(/\/$/, '') || '';

  // Format Rupiah tanpa desimal
  const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  // Hitung totalAll
  const totalAll = cartItems.reduce((sum, item) => {
    const qtyParsed = parseInt(editingQty[item.id], 10);
    const validQty = !isNaN(qtyParsed) && qtyParsed > 0 ? qtyParsed : item.reorder_quantity;
    return sum + item.product.price * validQty;
  }, 0);

  // Inisialisasi tanggal saat modal dibuka: hari ini "YYYY-MM-DD"
  useEffect(() => {
    if (isCartOpen) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      setReorderDate(dateString);
      setDeliveryDate(dateString);
      setDateErrors({});
    }
  }, [isCartOpen]);

  // Sync editingQty saat cartItems berubah
  useEffect(() => {
    const initial = {};
    cartItems.forEach(item => {
      initial[item.id] = item.reorder_quantity;
    });
    setEditingQty(initial);
  }, [cartItems]);

  // Validasi tanggal
  const validateDates = () => {
    const errors = {};
    if (!reorderDate) {
      errors.reorderDate = 'Tanggal butuh wajib diisi';
    }
    if (!deliveryDate) {
      errors.deliveryDate = 'Tanggal pengiriman tidak boleh kosong.';
    }
    if (reorderDate && deliveryDate) {
      const rd = new Date(reorderDate);
      const dd = new Date(deliveryDate);
      if (dd < rd) {
        errors.deliveryDate = 'Tanggal pengiriman harus hari ini atau setelahnya.';
      }
    }
    setDateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Format "YYYY-MM-DD" ke "DD-MM-YYYY" untuk backend
  const formatDateForBackend = (yyyyMMdd) => {
    const [year, month, day] = yyyyMMdd.split('-');
    return `${day}-${month}-${year}`;
  };

  // Handle perubahan quantity
  const handleQtyChange = async (itemId) => {
    // 1) Bersihkan error lama
    setQtyErrors(prev => ({ ...prev, [itemId]: null }));

    // 2) Ambil dan parse nilai baru
    const newQty = editingQty[itemId];
    const qtyNum = parseInt(newQty, 10);

    // 3) Validasi client‐side: minimal 1
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setQtyErrors(prev => ({ ...prev, [itemId]: 'Jumlah minimal 1.' }));
      setEditingQty(prev => ({ ...prev, [itemId]: 1 }));
      return;
    }

    // 4) Kirim ke backend dan tangkap error validasi
    try {
      await updateCartItem(itemId, qtyNum);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.reorder_quantity) {
        setQtyErrors(prev => ({
          ...prev,
          [itemId]: errors.reorder_quantity[0]
        }));
      } else {
        Swal.fire({
          title: 'Error',
          text: err.response?.data?.message || err.message,
          icon: 'error',
          willOpen: () => {
            const swalContainer = document.querySelector('.swal2-container');
            if (swalContainer) swalContainer.style.zIndex = '1400';
          }
        });
      }
    }
  };

  const handleRemove = async (itemId) => {
    const result = await Swal.fire({
      title: 'Hapus item?',
      text: 'Yakin ingin menghapus item ini dari keranjang?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal',
      willOpen: () => {
        const swalContainer = document.querySelector('.swal2-container');
        if (swalContainer) swalContainer.style.zIndex = '1400';
      }
    });
    if (result.isConfirmed) {
      try {
        await removeCartItem(itemId);
      } catch (err) {
        const msg = err.response?.data?.message || 'Gagal menghapus item';
        Swal.fire({
          title: 'Error',
          text: msg,
          icon: 'error',
          willOpen: () => {
            const swalContainer = document.querySelector('.swal2-container');
            if (swalContainer) swalContainer.style.zIndex = '1400';
          }
        });
      }
    }
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Swal.fire({
        title: 'Keranjang Kosong',
        text: 'Silakan tambahkan item terlebih dahulu.',
        icon: 'info',
        willOpen: () => {
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) swalContainer.style.zIndex = '1400';
        }
      });
      return;
    }
    const invalidItems = cartItems.filter(item => {
      const qty = parseInt(editingQty[item.id], 10);
      return isNaN(qty) || qty < 1;
    });
    if (invalidItems.length > 0) {
      Swal.fire({
        title: 'Error',
        text: 'Beberapa item memiliki jumlah kurang dari 1',
        icon: 'error',
        willOpen: () => {
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) swalContainer.style.zIndex = '1400';
        }
      });
      return;
    }
    if (!validateDates()) {
      return;
    }
    const result = await Swal.fire({
      title: 'Konfirmasi Pengadaan',
      html: `
        <p>Total barang: ${cartItems.length}</p>
        <p>Total harga: <strong>${formatRp(totalAll)}</strong></p>
        <p>Tanggal Butuh: ${reorderDate}</p>
        <p>Tanggal Pengiriman: ${deliveryDate}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Checkout',
      cancelButtonText: 'Batal',
      willOpen: () => {
        const swalContainer = document.querySelector('.swal2-container');
        if (swalContainer) swalContainer.style.zIndex = '1400';
      }
    });
    if (!result.isConfirmed) return;
    try {
      const payload = {
        reorder_date: formatDateForBackend(reorderDate),
        delivery_date: formatDateForBackend(deliveryDate),
      };
      await checkout(payload);
      Swal.fire({
        title: 'Sukses',
        text: 'Pengadaan berhasil dibuat',
        icon: 'success',
        willOpen: () => {
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) swalContainer.style.zIndex = '1400';
        }
      }).then(() => closeCart());
    } catch (err) {
      const resp = err.response;
      if (resp?.status === 400 && resp.data?.errors) {
        const errors = resp.data.errors;
        if (errors.delivery_date) {
          setDateErrors(prev => ({ ...prev, deliveryDate: errors.delivery_date[0] }));
        }
        if (errors.reorder_date) {
          setDateErrors(prev => ({ ...prev, reorderDate: errors.reorder_date[0] }));
        }
        if (errors.items) {
          Swal.fire({
            title: 'Error',
            text: errors.items.join('\n'),
            icon: 'error',
            willOpen: () => {
              const swalContainer = document.querySelector('.swal2-container');
              if (swalContainer) swalContainer.style.zIndex = '1400';
            }
          });
        }
      } else {
        const msg = resp?.data?.message || 'Gagal checkout';
        Swal.fire({
          title: 'Error',
          text: msg,
          icon: 'error',
          willOpen: () => {
            const swalContainer = document.querySelector('.swal2-container');
            if (swalContainer) swalContainer.style.zIndex = '1400';
          }
        });
      }
    }
  };

  // Styles
  const paperStyle = {
    width: { xs: '90%', md: 750 },
    height: { xs: '80vh', md: '439px' },
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 2,
    overflow: 'hidden',
  };
  const sidebarContainerSx = {
    width: { xs: '100%', sm: 300, md: 250 },
    bgcolor: 'grey.100',
    p: 1,
    borderRight: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  };
  const listContainerSx = {
    flex: 1,
    p: 1,
    bgcolor: 'grey.50',
    overflowY: 'auto',
  };

  return (
    <Modal
      open={isCartOpen}
      onClose={closeCart}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 2,
      }}>
        <Paper elevation={3} sx={paperStyle}>
          {/* HEADER */}
          <Box sx={{ p: 2, borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={closeCart}>
              <ArrowBackIosNewIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', mr: 1 }}>
              Daftar Pemesanan Barang
            </Typography>
          </Box>

          {/* KONTEN UTAMA */}
          {cartItems.length === 0 ? (
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Typography variant="subtitle1" color="text.secondary">
                Keranjang Kosong
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Daftar item */}
              <Box sx={listContainerSx}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {cartItems.map(item => {
                    // Logika URL gambar
                    const rawImage = item.product.image || '';
                    const cleaned = rawImage.replace(/^\//, '');
                    let imgSrc = '';
                    if (/^https?:\/\//i.test(cleaned)) {
                      imgSrc = cleaned;
                    } else if (cleaned.startsWith('images/')) {
                      imgSrc = `${backendBase}/storage/${cleaned}`;
                    } else {
                      imgSrc = `${backendBase}/${cleaned}`;
                    }
                    const qtyParsed = parseInt(editingQty[item.id], 10);
                    const validQty = !isNaN(qtyParsed) && qtyParsed > 0 ? qtyParsed : item.reorder_quantity;
                    const itemTotal = item.product.price * validQty;

                    return (
                      <Paper
                        key={item.id}
                        variant="outlined"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          bgcolor: '#fff',
                          borderRadius: 1,
                        }}
                      >
                        {/* Gambar produk */}
                        <Box
                          component="img"
                          src={imgSrc}
                          alt={item.product.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            const fallback = `${backendBase}/assets/images/default_product.jpg`;
                            e.currentTarget.src = fallback;
                          }}
                          sx={{ width: 45, height: 45, objectFit: 'cover', borderRadius: 1 }}
                        />

                        {/* Nama & stok serta quantity */}
                        <Box sx={{
                          flexGrow: 1,
                          display: 'flex',
                          alignItems: 'center',
                          ml: 3,
                        }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap>
                              {item.product.name}
                            </Typography>
                            <Typography variant="caption">Stok: {item.product.stock}</Typography>
                          </Box>
                          {/* Quantity input */}
                          <Box sx={{ width: 60, display: 'flex', justifyContent: 'center', mr: 5 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={editingQty[item.id]}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val)) {
                                  setEditingQty(prev => ({ ...prev, [item.id]: val }));
                                }
                              }}
                              onBlur={() => handleQtyChange(item.id)}
                              sx={{
                                width: '100%',
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
                          </Box>
                        </Box>

                        {/* Total harga item */}
                        <Box sx={{ width: 100, textAlign: 'left', ml: 1 }}>
                          <Typography variant="body2">Total:</Typography>
                          <Typography variant="subtitle2">{formatRp(itemTotal)}</Typography>
                        </Box>

                        {/* Tombol hapus */}
                        <IconButton size="small" onClick={() => handleRemove(item.id)}>
                          <HighlightOffIcon sx={{ color: '#DC2626' }} fontSize="small" />
                        </IconButton>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
              {/* Sidebar */}
              <Box sx={sidebarContainerSx}>
                <Paper elevation={1} sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, width: '100%' }}>
                  {/* Tanggal Butuh */}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Tanggal Butuh</Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={reorderDate}
                    disabled
                    sx={{ mb: 2 }}
                  />
                  {/* Tanggal Pengiriman */}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Tanggal Pengiriman</Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    error={Boolean(dateErrors.deliveryDate)}
                    helperText={dateErrors.deliveryDate || ''}
                    inputProps={{ min: reorderDate }}
                    sx={{ mb: 2 }}
                  />
                  <Divider sx={{ my: 1 }} />
                  {/* Total Harga */}
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle1">Total Harga:</Typography>
                    <Typography variant="h6" fontWeight="bold">{formatRp(totalAll)}</Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}

          {/* FOOTER */}
          <Divider />
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: '#fff' }}>
            <Button variant="outlined" onClick={closeCart} sx={{ textTransform: 'capitalize' }}>
              Tutup
            </Button>
            {cartItems.length > 0 && (
              <Button variant="contained" onClick={handleCheckout} sx={{ textTransform: 'capitalize' }}>
                Ambil Barang
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Modal>
  );
}
