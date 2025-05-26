import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Badge,
  Divider,
  Autocomplete,
  Modal,
  MenuItem,
  createTheme,
  ThemeProvider
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { FormatBold } from "@mui/icons-material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const theme = createTheme({
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
});

export default function CheckoutPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [errors, setErrors] = useState({ product: "", quantity: "" });
  const [openCart, setOpenCart] = useState(false);
  const [tanggalButuh, setTanggalButuh] = useState('');
  const [purposes, setPurposes] = useState([]);
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [initial, setInitial] = useState('');
  const [notes, setNotes] = useState('');
  const [editingQty, setEditingQty] = useState({});

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/products?page=1&limit=1000`, { headers:{ "ngrok-skip-browser-warning": "true" } })
      .then(res => {
        setProducts(res.data.data.data.map(p => ({ id: p.id, name: p.name })));

        axios
          .get(`${API_BASE_URL}/api/purposes`, { headers:{ "ngrok-skip-browser-warning":"true" } })
          .then(r2 => setPurposes(r2.data.data.data))
          .catch(console.error);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!openCart) return;
    axios
      .get(`${API_BASE_URL}/api/checkout-carts`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      })
      .then(res => {
      const normalized = res.data.data.data.map(it => ({
        ...it,
        quantity: it.checkout_quantity,    
        product: {
          ...it.product
        }
      }));
      setCartItems(normalized);
      })
      .catch(console.error);
  }, [openCart]);

  const handleAddCart = () => {
    let hasError = false;
    const newErrors = { product: "", quantity: "" };
    if (!selectedProduct) {
      newErrors.product = "Silakan pilih nama barang yang diinginkan.";
      hasError = true;
    }
    if (!quantity || Number(quantity) <= 0) {
      newErrors.quantity = "Masukkan jumlah barang yang valid.";
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    axios
      .post(
        `${API_BASE_URL}/api/checkout-carts`,
        { product_id: selectedProduct.id, checkout_quantity: +quantity },
        { headers: { "ngrok-skip-browser-warning": "true" } }
      )
      .then(res => {
        const newItem = {
          id: res.data.data.id,
          product: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            image: selectedProduct.image,   
            stock: selectedProduct.stock
          },
          quantity: +quantity
        };
        setCartItems(prev => [...prev, newItem]);
        setSelectedProduct(null);
        setQuantity("");
        setErrors({ product: "", quantity: "" });
      })
      .catch(err => {
        console.error("ERR ADD CART:", err.response?.status, err.response?.data);
        if (err.response?.data?.errors) {
          setErrors({
            product: err.response.data.errors.product_id?.[0] || "",
            quantity: err.response.data.errors.checkout_quantity?.[0] || ""
          });
        } else {
          alert(err.response?.data?.message || "Gagal menambah ke keranjang");
        }
      });
  };

  const handleCheckout = () => {
    axios.post(
      `${API_BASE_URL}/api/checkouts`,
      {
        tanggal_butuh: tanggalButuh,
        purpose_id: selectedPurpose?.id,
        initial,
        notes,
      },
      { headers: { 'ngrok-skip-browser-warning': 'true' } }
    )
    .then(() => {
      setOpenCart(false);
      setTanggalButuh(''); setSelectedPurpose(null);
      setInitial(''); setNotes('');
    })
    .catch(console.error);
  };

  const handleDeleteCartItem = (cartId) => {
    axios
      .delete(`${API_BASE_URL}/api/checkout-carts/${cartId}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      })
      .then(() => {
        setCartItems(prev => prev.filter(item => item.id !== cartId));
      })
      .catch(console.error);
  };
  
  const handleUpdateQuantity = (cartId, newQty) => {
    axios
      .patch(`${API_BASE_URL}/api/checkout-carts/${cartId}`, 
            { checkout_quantity: newQty },
            { headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning":"true" } })
      .then(res => {
        setCartItems(prev =>
          prev.map(it =>
            it.id === cartId ? { ...it, quantity: res.data.data.checkout_quantity } : it
          )
        );
      })
      .catch(err => {
        console.error("ERR UPDATE QTY:", err.response?.data);
        console.error("ERR UPDATE QTY – field errors:", err.response?.data?.errors);

      });
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setQuantity("");
    setErrors({ product: "", quantity: "" });
  };

  const handleOpenCart = () => setOpenCart(true);
  const handleCloseCart = () => setOpenCart(false);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f0f0f0', p: 3 }}>
        <Box
          sx={{
            bgcolor: '#C6E5FF',
            borderRadius: 2,
            mx: 2,
            my: 2,
            p: 4,
            position: 'relative',
            maxHeight: '89vh',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box component="img" src="/logosistem.png" alt="Logo" sx={{ height: 38 }} />
            <IconButton onClick={handleOpenCart}>
              <Badge badgeContent={cartItems.length} color="secondary">
                <ShoppingCartIcon sx={{ color: 'black' }} />
              </Badge>
            </IconButton>
          </Box>

          <Typography variant="h4" align="center" sx={{ mb: 1 }}>
            Form untuk Pengambilan Barang ATK
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 5, color: 'rgba(0,0,0,0.7)' }}>
            Sistem manajemen ATK mengelola seluruh proses manajemen dan pengambilan ATK.
          </Typography>

          <Paper
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              p: 0.5,
              mx: 8,
              my: 7,
            }}
            elevation={2}
          >
            <Grid container spacing={4}>
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    bgcolor: '#1976D2',
                    color: 'white',
                    borderRadius: 1,
                    p: 3,
                    height: 310,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, ml: 2.5 }}>
                    Cara Pengambilan
                  </Typography>
                  <ul style={{ paddingLeft: 20, margin: 0 }} >
                    <li>1. Pilih nama barang yang ingin diambil</li>
                    <li>2. Masukkan jumlah barang yang dibutuhkan</li>
                    <li>3. Klik tombol Keranjang untuk menambah ke keranjang</li>
                    <li>4. Klik ikon Keranjang untuk melihat daftar barang</li>
                    <li>5. Lengkapi data pengambilan di halaman keranjang</li>
                    <li>6. Klik tombol Ambil Barang untuk menyelesaikan proses</li>
                  </ul>
                </Box>
              </Grid>

              <Grid item xs={12} md={6} mt={3} sx={{ ml: 4 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Nama Barang
                    </Typography>
                    <Autocomplete
                      options={products}
                      getOptionLabel={opt => opt.name}
                      value={selectedProduct}
                      onChange={(e, val) => {
                        setSelectedProduct(val);
                        if (errors.product) setErrors(prev => ({ ...prev, product: '' }));
                      }}
                      disablePortal
                      ListboxProps={{ style: { maxHeight: 200 } }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          size="small"
                          fullWidth
                          error={Boolean(errors.product)}
                          helperText={errors.product || ' '}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} mt={-2}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Jumlah
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={quantity}
                      onChange={e => {
                        setQuantity(e.target.value);
                        if (errors.quantity) setErrors(prev => ({ ...prev, quantity: '' }));
                      }}
                      error={Boolean(errors.quantity)}
                      helperText={errors.quantity || ' '}
                    />
                  </Grid>

                  <Grid item xs={12} mt={-1}>
                    <Box sx={{ display: 'flex', justifyContent: 'right', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ textTransform: 'capitalize' }}
                        onClick={handleAddCart}
                      >
                        Keranjang
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                        onClick={handleClose}
                      >
                        Hapus
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>
      <Modal
        open={openCart}
        onClose={handleCloseCart}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.5)',
          p: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: 500,
            height: '80vh',            // pastikan height fixed sehingga flexGrow=1 bekerja
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* HEADER (sticky) */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconButton onClick={handleCloseCart}>
              <ArrowBackIosNewIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', mr: 1 }}>
              Daftar Keranjang
            </Typography>
          </Box>

          {/* SCROLLABLE AREA: List + Form */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 1,
              bgcolor: '#f5f5f5',      // abu-abu di belakang keseluruhan
            }}
          >
            {/* PANEL ITEM */}
              {cartItems.length === 0
                ? <Typography align="center" color="text.secondary">Keranjang kosong</Typography>
                : cartItems.map(item => (
                    <Paper key={item.id} variant="outlined" sx={{ display:'flex', alignItems:'center', p:2, mb:1 }}>
                      <Box
                        component="img"
                        src={`${API_BASE_URL}/storage/${item.product.image}`} 
                        alt={item.product.name}
                        sx={{ width: 45, height: 45, mr: 2, objectFit: 'cover' }}
                      />                      
                      <Box sx={{ flexGrow:1, ml: 3 }}>
                        <Typography variant="subtitle2" fontWeight="bold" >{item.product.name}</Typography>
                        <Typography variant="caption">Stok : {item.product.stock}</Typography>
                      </Box>
                      <TextField
                        size="small"
                        value={editingQty[item.id] ?? item.quantity}               
                        onChange={e =>                                         
                          setEditingQty(prev => ({ ...prev, [item.id]: e.target.value }))
                        }                                                        
                        onBlur={() => {                                         
                          const val = parseInt(editingQty[item.id] ?? item.quantity, 10);
                          if (!isNaN(val) && val > 0 && val !== item.quantity) {
                            handleUpdateQuantity(item.id, val);
                          }
                        }}
                        sx={{ width:60, mr:11 }}
                        InputProps={{
                          sx: { '& input': { textAlign: 'center' } }
                        }}
                      />                      
                      <IconButton onClick={() => handleDeleteCartItem(item.id)}>
                        {/* <CloseIcon color="error" /> */}
                        <HighlightOffIcon sx={{ color: '#DC2626' }} />
                      </IconButton>
                    </Paper>
                  ))
              }
            {/* PANEL FORM */}
            <Box sx={{ mt: 1, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Tanggal Butuh</Typography>
              <TextField
                type="date"
                fullWidth size="small"
                InputLabelProps={{ shrink: true }}
                value={tanggalButuh}
                onChange={e => setTanggalButuh(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Kebutuhan</Typography>
              <Autocomplete
                options={purposes}
                getOptionLabel={opt => opt.name}
                value={selectedPurpose}
                onChange={(_, val) => setSelectedPurpose(val)}
                disablePortal
                fullWidth
                size="small"
                renderInput={params => (
                  <TextField
                    {...params}
                    
                    placeholder="Pilih kebutuhan"
                    size="small"
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                )}
              />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Inisial</Typography>
              <TextField
                fullWidth size="small" inputProps={{ maxLength:3 }}
                value={initial} onChange={e=>setInitial(e.target.value.toUpperCase())}
                placeholder="Misal: RZI" sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Catatan</Typography>
              <TextField
                fullWidth size="small"
                multiline rows={3}
                value={notes} onChange={e=>setNotes(e.target.value)}
              />
            </Box>
          </Box>


          {/* FOOTER BUTTONS (sticky) */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCheckout}
            >
              Ambil Barang
            </Button>
            <Button variant="outlined" onClick={handleCloseCart}>
              Tutup
            </Button>
          </Box>
        </Paper>
      </Modal>
    </ThemeProvider>
  );
}
