import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button, MenuItem, InputAdornment } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

export default function AddProduct({ CloseEvent, onSuccess }) {
    const [product, setProduct] = useState({
        name: "",
        stock: "",
        price: "",
        unit: "",
        category_id: "",
        image: null,
        imageName: "",
    });

    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]); // Tambahkan state untuk units

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get("https://c47e-125-165-104-99.ngrok-free.app/api/categories", {
                    headers: { "ngrok-skip-browser-warning": "true", "Accept": "application/json" },
                });

                if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
                    setCategories(response.data.data.data);
                } else {
                    console.error("Format data kategori tidak valid:", response.data);
                    setCategories([]);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategories([]);
            }
        };

        fetchCategories();
    }, []);

    // Fetch Units
    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const response = await axios.get("https://c47e-125-165-104-99.ngrok-free.app/api/units", {
                    headers: { "ngrok-skip-browser-warning": "true", "Accept": "application/json" },
                });
    
                // Pastikan format data yang diterima sesuai dengan yang diharapkan
                if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
                    setUnits(response.data.data.data);
                } else {
                    console.error("Format data units tidak valid:", response.data);
                    setUnits([]);
                }
            } catch (error) {
                console.error("Error fetching units:", error);
                setUnits([]);
            }
        };
    
        fetchUnits();
    }, []);
    

    const handleChange = (event) => {
        setProduct({ ...product, [event.target.name]: event.target.value });
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        setProduct({ ...product, image: file, imageName: file ? file.name : "" });
    };

    const createProduct = async () => {
        if (!product.name.trim() || !product.stock.trim() || !product.price.trim() || !product.category_id.trim() || !product.unit.trim() || !product.image) {
            Swal.fire("Error!", "Semua kolom harus diisi.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("name", product.name);
        formData.append("stock", product.stock);
        formData.append("price", product.price);
        formData.append("unit", product.unit);
        formData.append("category_id", product.category_id);
        formData.append("image", product.image);

        try {
            const response = await axios.post(
                "https://c47e-125-165-104-99.ngrok-free.app/api/products",
                formData,
                { headers: { "Content-Type": "multipart/form-data", "ngrok-skip-browser-warning": "true" } }
            );

            if (response.status === 201) {
                if (onSuccess) onSuccess();
                Swal.fire("Berhasil!", "Produk telah ditambahkan.", "success");
                CloseEvent();
            }
        } catch (error) {
            console.error("Error adding product:", error);
            Swal.fire("Error!", "Gagal menambahkan produk.", "error");
        }
    };

    return (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ width: "100%", textAlign: "center", pb: 2 }}>
                <Typography variant="h6">Form Tambah Produk</Typography>
            </Box>

            <Box sx={{ maxHeight: "50vh", overflowY: "auto", p: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Nama Produk</Typography>
                        <TextField variant="outlined" size="small" name="name" onChange={handleChange} value={product.name} sx={{ minWidth: "100%" }} />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Kategori</Typography>
                        <TextField
                            select
                            variant="outlined"
                            size="small"
                            name="category_id"
                            onChange={handleChange}
                            value={product.category_id}
                            sx={{ minWidth: "100%" }}
                        >
                            {categories.length > 0 ? (
                                categories.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>Data kategori belum tersedia</MenuItem>
                            )}
                        </TextField>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Stock</Typography>
                        <TextField type="number" variant="outlined" size="small" name="stock" onChange={handleChange} value={product.stock} sx={{ minWidth: "100%" }} />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Harga</Typography>
                        <TextField type="number" variant="outlined" size="small" name="price" onChange={handleChange} value={product.price} sx={{ minWidth: "100%" }} />
                    </Grid>

                    {/* Dropdown Units */}
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Unit</Typography>
                        <TextField
                            select
                            variant="outlined"
                            size="small"
                            name="unit"
                            onChange={handleChange}
                            value={product.unit}
                            sx={{ minWidth: "100%" }}
                        >
                            {units.length > 0 ? (
                                units.map((unit) => (
                                    <MenuItem key={unit.id} value={unit.id}>{unit.name}</MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>Data unit belum tersedia</MenuItem>
                            )}
                        </TextField>
                    </Grid>


                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Gambar Produk</Typography>
                        <TextField
                            variant="outlined"
                            size="small"
                            value={product.imageName}
                            placeholder="No File Choosen"
                            sx={{ 
                                width: "100%",
                                "& .MuiOutlinedInput-root": {
                                    display: "flex",
                                    alignItems: "center",
                                    paddingLeft: 0,
                                }, 
                            }}
                            InputProps={{
                                readOnly: true,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Button variant="contained" component="label"  
                                        sx={{
                                            bgcolor: "#E4E6EF",
                                            color: "black",
                                            borderRadius: "4px 0 0 4px",
                                            height: "38px",
                                            boxShadow: "none",
                                            textTransform: "none", 
                                            "&:hover": { bgcolor: "#d1d3db" }
                                        }}>
                                            Choose File
                                            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                                        </Button>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ width: "100%", textAlign: "center", pt: 2 }}>
                <Button variant="contained" onClick={createProduct}>Simpan</Button>
                <Button variant="contained" onClick={CloseEvent} sx={{ ml: 1, bgcolor: "#E4E6EF", color: "black" }}>Tutup</Button>
            </Box>
        </Box>
    );
}
