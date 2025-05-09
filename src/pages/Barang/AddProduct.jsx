import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button, MenuItem } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

export default function AddProduct({ CloseEvent, onSuccess }) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [image, setImage] = useState(null);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");
    const [formattedPrice, setFormattedPrice] = useState("");

    useEffect(() => {
        fetchCategories();
        fetchUnits();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('https://80ea-125-165-106-71.ngrok-free.app/api/categories', {
                headers: { "ngrok-skip-browser-warning": "true" },
            });
            setCategories(response.data.data.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchUnits = async () => {
        try {
            const response = await axios.get("https://80ea-125-165-106-71.ngrok-free.app/api/units", {
                headers: { "ngrok-skip-browser-warning": "true" },
            });
            setUnits(response.data.data.data);
        } catch (error) {
            console.error("Error fetching units:", error);
        }
    };

    const handleFileChange = (event) => {
        setImage(event.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!name || !price || !stock || !image || !selectedCategory || !selectedUnit) {
            Swal.fire("Error!", "Semua field wajib diisi!", "error");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("price", price);
        formData.append("stock", stock);
        formData.append("image", image);
        formData.append("category_id", selectedCategory);
        formData.append("unit_id", selectedUnit);

        try {
            const response = await axios.post(
                "https://80ea-125-165-106-71.ngrok-free.app/api/products",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );

            if (response.status === 201) {
                if (onSuccess) onSuccess();
                CloseEvent();
                Swal.fire("Berhasil!", "Produk berhasil ditambahkan!", "success");
            }
        } catch (error) {
            console.error("Error adding product:", error);
            CloseEvent();
            Swal.fire("Error!", "Gagal menambahkan produk.", "error");
        }
    };

    const formatRupiah = (value) => {
        const numberString = value.replace(/[^,\d]/g, "").toString();
        const split = numberString.split(",");
        const sisa = split[0].length % 3;
        let rupiah = split[0].substr(0, sisa);
        const ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    
        if (ribuan) {
            rupiah += (sisa ? "." : "") + ribuan.join(".");
        }
    
        rupiah = split[1] !== undefined ? rupiah + "," + split[1] : rupiah;
        return rupiah ? "Rp " + rupiah : "";
    };

    const handlePriceChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        setPrice(rawValue); // untuk dikirim ke backend
        setFormattedPrice(formatRupiah(e.target.value)); // untuk tampil
    };    
    
    return (
        <>
            <Box sx={{ width: "100%", textAlign: "center" }}>
                <Typography variant="h6">Form Tambah Produk</Typography>
            </Box>
            <Box height={20} />
    
            {/* Scrollable container */}
            <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Nama Produk</Typography>
                        <TextField fullWidth size="small" value={name} onChange={(e) => setName(e.target.value)} />
                    </Grid>
    
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Harga</Typography>
                        <TextField fullWidth size="small" value={formattedPrice} onChange={handlePriceChange} />
                    </Grid>
    
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Stok</Typography>
                        <TextField fullWidth size="small" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
                    </Grid>
    
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Kategori</Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
    
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Satuan</Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                        >
                            {units.map((unit) => (
                                <MenuItem key={unit.id} value={unit.id}>
                                    {unit.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
    
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Gambar</Typography>
                        <Box sx={{ display: 'flex', width: '100%' }}>
                            <Button
                            component="label"
                            variant="outlined"
                            sx={{
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                                borderTopLeftRadius: 4,
                                borderBottomLeftRadius: 4,
                                borderRight: '1px solid #c4c4c4',
                                borderColor: '#c4c4c4', // <- ini penting buat nyamain warnanya
                                bgcolor: '#E4E6EF',
                                color: 'black',
                                px: 3,
                                whiteSpace: 'nowrap',
                                textTransform: 'none',
                                height: '40px',
                                "&:hover": {
                                bgcolor: '#d1d3db',
                                borderColor: '#c4c4c4', // <- biar hovernya nggak berubah biru
                                },
                            }}
                            >
                            Choose file
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => setImage(e.target.files[0])}
                            />
                            </Button>
                            <TextField
                            fullWidth
                            size="small"
                            value={image ? image.name : ""}
                            placeholder="No file chosen"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                height: '40px',
                                }
                            }}
                            InputProps={{
                                readOnly: true,
                            }}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
    
            {/* Tombol bawah */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                    <Typography variant="h5" align="center">
                        <Button variant="contained" onClick={handleSubmit}>Simpan</Button>
                        <Button
                            variant="contained"
                            onClick={CloseEvent}
                            sx={{ ml: 1, bgcolor: "#E4E6EF", color: "black", "&:hover": { bgcolor: "#d1d3db" } }}
                        >
                            Tutup
                        </Button>
                    </Typography>
                </Grid>
            </Grid>
        </>
    );
    
}
