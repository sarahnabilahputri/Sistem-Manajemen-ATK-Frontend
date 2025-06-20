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
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClearIcon from '@mui/icons-material/Clear';
import Swal from "sweetalert2";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const backendBase = API_BASE_URL.replace(/\/$/, '');

const theme = createTheme({
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
});

function toLocalDatetimeInputValue(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const Y = date.getFullYear();
  const M = pad(date.getMonth()+1);
  const D = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  return `${Y}-${M}-${D}T${h}:${m}`;
}

export default function CheckoutPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [errors, setErrors] = useState({ product: "", quantity: "" });
  const [openCart, setOpenCart] = useState(false);
  const [tanggalButuh, setTanggalButuh] = useState(toLocalDatetimeInputValue());
  const [purposes, setPurposes] = useState([]);
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [description, setDescription] = useState("");
  const [editingQty, setEditingQty] = useState({});
  const [initialOptions, setInitialOptions] = useState([]);
  const [initial, setInitial] = useState("");
  const [inputVal, setInputVal]   = useState("");
  const [userMap, setUserMap] = useState({}); 
  const selectedUserId = userMap[initial];
  const [checkoutErrors, setCheckoutErrors] = useState({
    checkout_date: "",
    purpose_id: "",
    user_id: ""
  });
  const [checkoutTouched, setCheckoutTouched] = useState(false);
  const [qtyErrors, setQtyErrors] = useState({});
  const handleCloseCart = () => setOpenCart(false);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/products?page=1&limit=1000`, { headers:{ "ngrok-skip-browser-warning": "true" } })
      .then(res => {
        setProducts(res.data.data.data.map(p => ({ id: p.id, name: p.name, stock: p.stock })));

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

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/users?page=1&limit=1000`, {
      headers: { "ngrok-skip-browser-warning": "true" }
    })
      .then(res => {
        const top    = res   ?.data;
        const pagin  = top   ?.data;
        const users  = Array.isArray(pagin?.data) 
                      ? pagin.data 
                      : (Array.isArray(pagin) ? pagin : []);
        
        const staffUsers = users.filter(u => u.role === "Staff");
        const initials = [...new Set(staffUsers.map(u => u.initial).filter(Boolean))];
        setInitialOptions(initials);

        const map = {};
        staffUsers.forEach(u => {
          if (u.initial) {
            map[u.initial.toUpperCase()] = u.id;
          }
        });
        setUserMap(map);
      })
      .catch(err => {
        handleCloseCart();
        console.error("Error fetching users / initials:", err);
        setInitialOptions([]);  
      });
  }, []);

  
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

        Swal.fire({
          title: "Berhasil!",
          text: res.data.message || "Berhasil ditambahkan ke keranjang.",
          icon: "success"
        });
      })
      .catch(err => {
        handleCloseCart();
        console.error("ERR ADD CART:", err.response?.status, err.response?.data);
        if (err.response?.status === 422 && err.response.data.errors) {
          const messages = Object.values(err.response.data.errors).flat().join("\n");
          Swal.fire("Validasi Gagal", messages, "error");
        } else {
          Swal.fire("Error!", err.response?.data?.message || "Gagal menambah ke keranjang.", "error");
        }
      });
  };

  const handleCheckout = () => {
    setCheckoutTouched(true);
    setCheckoutErrors({ checkout_date: "", purpose_id: "", user_id: "" });

    const newErr = { checkout_date: "", purpose_id: "", user_id: "" };
    let hasErr = false;
    if (!tanggalButuh) {
      newErr.checkout_date = "Tanggal pengambilan wajib diisi";
      hasErr = true;
    }
    if (!selectedPurpose) {
      newErr.purpose_id = "Kebutuhan wajib diisi";
      hasErr = true;
    }
    if (initial.length !== 3 || !userMap[initial]) {
      newErr.user_id = "Inisial wajib diisi (3 huruf)";
      hasErr = true;
    }
    if (hasErr) {
      setCheckoutErrors(newErr);
      return;
    }

    const token = localStorage.getItem("access_token");
    const selectedUserId = userMap[initial];     

    if (!selectedUserId) {
      alert("Inisial tidak valid—pilih salah satu dari dropdown!");
      return;
    }

    const payload = {
      user_id:     selectedUserId,               
      checkout_date: new Date(tanggalButuh).toISOString(),
      purpose_id:    selectedPurpose.id,
      description,                               
    };
    console.log("Payload checkout:", payload);

    axios.post(`${API_BASE_URL}/api/checkouts`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      }
    })
    .then(res => {
      const co = res.data.data;

      const newItem = {
        id: co.id,
        initial: initial,
        name: co.user_name,          
        date: co.checkout_date,
        purpose: selectedPurpose.name,
        description,
        items: co.items.map(it => ({
          id: it.id,
          product: it.product,
          qty: it.checkout_quantity
        }))
      };

      if (window.opener) {
        window.opener.postMessage(
          { type: 'NEW_CHECKOUT', data: newItem },
          window.location.origin
        );
      }

      console.log("Checkout sukses:", res.data);
      Swal.fire({
        title: "Berhasil!",
        text: res.data.message || "Pengambilan barang berhasil.",
        icon: "success"
      });
      setCartItems([]);
      setOpenCart(false);
      setTanggalButuh(new Date().toISOString().split('T')[0]);
      setSelectedPurpose(null);
      setInitial("");
      setDescription("");
      setCheckoutErrors({ checkout_date: "", purpose_id: "", user_id: "" });
    })
    .catch(err => {
      console.error("FULL ERROR OBJECT:", err);
      console.error("err.response =", err.response);
      console.error("err.request =", err.request);
      console.error("err.message =", err.message);
      console.error("ERR CHECKOUT response:", err.response?.data);
      if (err.response?.status === 422 && err.response.data.errors) {
        const e = err.response.data.errors;
        setCheckoutErrors({
          checkout_date: e.checkout_date?.[0] || "",
          purpose_id:    e.purpose_id?.[0]    || "",
          user_id:       e.user_id?.[0]       || ""
        });
      } else {
        handleCloseCart();
        Swal.fire("Error!", err.response?.data?.message || "Gagal melakukan checkout.", "error");
      }   
    });
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

  const handleOpenCart = () => {
    setTanggalButuh(toLocalDatetimeInputValue());
    setOpenCart(true);
  };  

  const handleIncrementQty = async (item) => {
    const curr = parseInt(editingQty[item.id], 10);
    const currentQty = !isNaN(curr) && curr > 0 ? curr : item.reorder_quantity;
    const nextQty = currentQty + 1;
    if (item.product.stock != null && nextQty > item.product.stock) {
      setQtyErrors(prev => ({ ...prev, [item.id]: `Maksimal stok ${item.product.stock}.` }));
      return;
    }
    setQtyErrors(prev => ({ ...prev, [item.id]: null }));
    setEditingQty(prev => ({ ...prev, [item.id]: nextQty }));
    try {
      await updateCartItem(item.id, nextQty);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.reorder_quantity) {
        setQtyErrors(prev => ({ ...prev, [item.id]: errors.reorder_quantity[0] }));
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
      setEditingQty(prev => ({ ...prev, [item.id]: currentQty }));
    }
  };

  const handleDecrementQty = async (item) => {
    const curr = parseInt(editingQty[item.id], 10);
    const currentQty = !isNaN(curr) && curr > 0 ? curr : item.reorder_quantity;
    const nextQty = currentQty - 1;
    if (nextQty < 1) {
      setQtyErrors(prev => ({ ...prev, [item.id]: 'Jumlah minimal 1.' }));
      return;
    }
    setQtyErrors(prev => ({ ...prev, [item.id]: null }));
    setEditingQty(prev => ({ ...prev, [item.id]: nextQty }));
    try {
      await updateCartItem(item.id, nextQty);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.reorder_quantity) {
        setQtyErrors(prev => ({ ...prev, [item.id]: errors.reorder_quantity[0] }));
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
      setEditingQty(prev => ({ ...prev, [item.id]: currentQty }));
    }
  };

  const handleQtyChange = async (itemId) => {
    const raw = editingQty[itemId];
    let qtyNum = parseInt(raw, 10);
    if (isNaN(qtyNum) || qtyNum < 1) qtyNum = 1;
    const item = cartItems.find(it => it.id === itemId);
    if (!item) return;
    
    if (item.product.stock != null && qtyNum > item.product.stock) {
      qtyNum = item.product.stock;
      setQtyErrors(prev => ({ ...prev, [itemId]: `Maksimal stok ${item.product.stock}.` }));
    } else {
      setQtyErrors(prev => ({ ...prev, [itemId]: null }));
    }
    setEditingQty(prev => ({ ...prev, [itemId]: qtyNum }));
    if (qtyNum !== item.quantity) {
      try {
        await handleUpdateQuantity(itemId, qtyNum); 
      } catch (err) {
        console.error(err);
        setEditingQty(prev => ({ ...prev, [itemId]: item.quantity }));
        Swal.fire("Error", "Gagal memperbarui jumlah item.", "error");
      }
    }
  };


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
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
                      {selectedProduct && selectedProduct.stock != null && (
                        <Typography variant="caption" sx={{ mt: -2, ml: 1, color: 'text.secondary' }}>
                          Stok: {selectedProduct.stock}
                        </Typography>
                      )}
                    </Box>
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
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          setQuantity(val);
                          if (errors.quantity) setErrors(prev => ({ ...prev, quantity: '' }));
                        }
                      }}
                      onBlur={() => {
                        const valNum = parseInt(quantity, 10);
                        if (isNaN(valNum) || valNum < 1) {
                          setQuantity("1");
                        }
                        else if (selectedProduct && selectedProduct.stock != null && valNum > selectedProduct.stock) {
                          setQuantity(String(selectedProduct.stock));
                        }
                      }}
                      inputProps={{ min: 1 }}
                      error={Boolean(errors.quantity)}
                      helperText={errors.quantity || ' '}
                    />
                  </Grid>

                  <Grid item xs={12} mt={-1}>
                    <Box sx={{ display: 'flex', justifyContent: 'right', gap: 2 }}>
                      <Button
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                        onClick={handleClose}
                      >
                        Hapus
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ textTransform: 'capitalize' }}
                        onClick={handleAddCart}
                      >
                        Keranjang
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
            height: '80vh',           
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
              bgcolor: '#f5f5f5',      
            }}
          >
            {/* PANEL ITEM */}
              {cartItems.length === 0
                ? (
                  <Box
                    sx={{
                      height: '100%',           
                      display: 'flex',
                      alignItems: 'center',      
                      justifyContent: 'center',  
                    }}
                  >
                    <Typography color="text.secondary">
                      Daftar Keranjang Kosong 
                    </Typography>
                  </Box>
                )
                : cartItems.map(item => {
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
                    <Paper key={item.id} variant="outlined" sx={{ display:'flex', alignItems:'center', p:2, mb:1 }}>
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
                      <Box sx={{ flexGrow:1, ml: 6 }}>
                        <Typography variant="subtitle2" fontWeight="bold" >{item.product.name}</Typography>
                        <Typography variant="caption">Stok : {item.product.stock}</Typography>
                      </Box>
                      <TextField
                        size="small"
                        type="number"
                        value={editingQty[item.id] ?? item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*$/.test(val)) {
                            setEditingQty(prev => ({ ...prev, [item.id]: val }));
                          }
                        }}
                        onBlur={() => {
                          const raw = editingQty[item.id];
                          const val = parseInt(raw, 10);
                          if (isNaN(val) || val < 1) {
                            setEditingQty(prev => ({ ...prev, [item.id]: 1 }));
                            handleUpdateQuantity(item.id, 1);
                          } else if (val !== item.quantity) {
                            handleUpdateQuantity(item.id, val);
                          }
                        }}
                        sx={{
                          width: 60,
                          mr: 9,
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
                      <IconButton onClick={() => handleDeleteCartItem(item.id)}>
                        <HighlightOffIcon sx={{ color: '#DC2626' }} />
                      </IconButton>
                    </Paper>
                    );
                  })
              }
            {/* PANEL FORM */}
            {cartItems.length > 0 && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Tanggal Butuh</Typography>
              <TextField
                type="datetime-local"
                fullWidth size="small"
                InputLabelProps={{ shrink: true }}
                value={tanggalButuh}
                onChange={e => {
                  setTanggalButuh(e.target.value);
                  if (checkoutErrors.checkout_date) setCheckoutErrors(prev => ({ ...prev, checkout_date: "" }));
                }}
                error={checkoutTouched && Boolean(checkoutErrors.checkout_date)}
                helperText={checkoutTouched
                  ? (checkoutErrors.checkout_date || " ")
                  : " "
                }
                sx={{ mb: checkoutErrors.checkout_date ? 1 : -1 }}
              />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Kebutuhan</Typography>
              <Autocomplete
                options={purposes}
                getOptionLabel={opt => opt.name}
                value={selectedPurpose}
                onChange={(_, val) => {
                  setSelectedPurpose(val);
                  if (checkoutErrors.purpose_id) setCheckoutErrors(prev => ({ ...prev, purpose_id: "" }));
                }}
                disablePortal
                fullWidth
                size="small"
                renderInput={params => (
                  <TextField
                    {...params}
                    
                    placeholder="Pilih kebutuhan"
                    size="small"
                    fullWidth
                    error={checkoutTouched && Boolean(checkoutErrors.purpose_id)}
                    helperText={checkoutTouched
                      ? (checkoutErrors.purpose_id || " ")
                      : " "
                    }
                    sx={{ mb: checkoutErrors.purpose_id ? 1 : -1 }}
                  />
                )}
              />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Inisial</Typography>
              <Autocomplete
                options={initialOptions}             
                getOptionLabel={opt => opt}
                value={initial}                      
                disablePortal
                fullWidth
                size="small"
                popupIcon={<ArrowDropDownIcon />}  
                clearOnEscape
                clearIcon={initial ? <ClearIcon sx={{ fontSize: 20 }} /> : null}
                ListboxProps={{ style: { maxHeight: 200 } }}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder="Pilih inisial"
                    error={checkoutTouched && Boolean(checkoutErrors.user_id)}
                    helperText={checkoutTouched
                      ? (checkoutErrors.user_id || " ")
                      : " "
                    }
                    inputProps={{
                      ...params.inputProps,
                      value: initial,                 
                      maxLength: 3,                    
                      onChange: e => {
                        const clean = e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z]/g, "")
                          .slice(0, 3);
                        setInitial(clean);
                        if (checkoutErrors.user_id) setCheckoutErrors(prev => ({ ...prev, user_id: "" }));
                      }
                    }}
                    sx={{ mb: checkoutErrors.user_id ? 1 : -1 }}
                  />
                )}
                onChange={(_, newVal) => {
                  setInitial((newVal || "").toUpperCase().slice(0, 3));
                  if (checkoutErrors.user_id) setCheckoutErrors(prev => ({ ...prev, user_id: "" }));
                }}
              />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Catatan</Typography>
              <TextField
                fullWidth size="small"
                multiline rows={3}
                value={description} onChange={e=>setDescription(e.target.value)}
              />
            </Box>
            )}
          </Box>
          
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              mr: 1,
            }}
          >
            <Button variant="outlined" onClick={handleCloseCart} sx={{ textTransform: 'capitalize' }}>
              Tutup
            </Button>
            {cartItems.length > 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCheckout}
                sx={{ textTransform: 'capitalize' }}
              >
                Ambil Barang
              </Button>
            )}     
          </Box>
        </Paper>
      </Modal>
    </ThemeProvider>
  );
}
