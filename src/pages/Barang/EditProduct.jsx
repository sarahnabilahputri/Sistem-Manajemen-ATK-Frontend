import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button, MenuItem } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";
import InputAdornment from "@mui/material/InputAdornment";

export default function EditProduct({ fid, CloseEvent, onSuccess }) {
    const [product, setProduct] = useState({
        name: "",
        stock: "",
        price: "",
        unit_id: "",
        category_id: "",
        image: null,
        imageName: "No File Chosen",
    });

    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);

    const fetchProductById = async (id) => {
        try {
            const response = await axios.get(
                `https://f389-125-165-106-98.ngrok-free.app/api/products/${id}`,
                { headers: { "ngrok-skip-browser-warning": "true", "Accept": "application/json" } }
            );

            const data = response.data.data;
            let fullImageUrl = data.image
                ? `https://f389-125-165-106-98.ngrok-free.app/storage/${data.image}`
                : null;

            setProduct({
                name: data.name,
                stock: data.stock.toString(),
                price: data.price.toString(),
                unit_id: data.unit_id,
                category_id: data.category_id,
                image: null,
                imageName: data.image ? data.image.split("/").pop() : "No File Chosen",
            });

            setImagePreview(fullImageUrl);
        } catch (error) {
            console.error("❌ Error fetching product:", error);
            Swal.fire("Error!", "Gagal mengambil data produk.", "error");
        }
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get("https://f389-125-165-106-98.ngrok-free.app/api/categories", {
                    headers: { "ngrok-skip-browser-warning": "true", "Accept": "application/json" },
                });
                setCategories(response.data?.data?.data || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        const fetchUnits = async () => {
            try {
                const response = await axios.get("https://f389-125-165-106-98.ngrok-free.app/api/units", {
                    headers: { "ngrok-skip-browser-warning": "true", "Accept": "application/json" },
                });
                setUnits(response.data?.data?.data || []);
            } catch (error) {
                console.error("Error fetching units:", error);
            }
        };

        Promise.all([fetchCategories(), fetchUnits()]).then(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!loading && fid?.id) {
            fetchProductById(fid.id);
        }
    }, [fid, loading]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setProduct({ ...product, [name]: value });
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProduct({
                ...product,
                image: file,
                imageName: file.name,
            });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const updateProduct = async () => {
        const { name, stock, price, unit_id, category_id, image } = product;
    
        if (!name || !stock || !price || !unit_id || !category_id) {
            Swal.fire("Error!", "Semua kolom harus diisi.", "error");
            return;
        }
    
        if (parseInt(stock) < 0 || parseFloat(price) < 0) {
            Swal.fire("Error!", "Stock dan harga harus lebih besar dari 0.", "error");
            return;
        }
    
        console.log("product sebelum submit:", product);
        console.log("Update ID:", fid?.id);
    
        const formData = new FormData();
        formData.append("name", name);
        formData.append("stock", parseInt(stock));
        formData.append("price", parseFloat(price));
        formData.append("unit_id", unit_id);
        formData.append("category_id", category_id);
        
        // Tambahkan hanya jika ada file yang diunggah
        if (image) {
            formData.append("image", image);
        }
    
        // Debug: Cek isi FormData
        for (let pair of formData.entries()) {
            console.log(`${pair[0]}:`, pair[1]);
        }
    
        try {
            const response = await axios.patch(
                `https://f389-125-165-106-98.ngrok-free.app/api/products/${fid.id}`, // Pastikan fid.id valid
                formData,
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                        "Accept": "application/json"
                        // Content-Type tidak perlu diset jika menggunakan FormData
                    }
                }
            );
    
            if (response.status === 200) {
                Swal.fire("Berhasil!", "Produk telah diperbarui.", "success").then(() => {
                    onSuccess();
                    CloseEvent();
                });
            }
        } catch (error) {
            console.error("❌ Error updating product:", error);
            Swal.fire("Error!", error?.response?.data?.message || "Gagal memperbarui produk.", "error");
        }
    };       

    return (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" align="center" pb={2}>Form Edit Produk</Typography>

            <Box sx={{ maxHeight: "50vh", overflowY: "auto", p: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography>Nama Produk</Typography>
                        <TextField fullWidth size="small" name="name" value={product.name} onChange={handleChange} />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography>Kategori</Typography>
                        <TextField select fullWidth size="small" name="category_id" value={product.category_id} onChange={handleChange}>
                            {categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography>Stock</Typography>
                        <TextField fullWidth size="small" type="number" name="stock" value={product.stock} onChange={handleChange} />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography>Harga</Typography>
                        <TextField fullWidth size="small" type="number" name="price" value={product.price} onChange={handleChange} />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography>Unit</Typography>
                        <TextField select fullWidth size="small" name="unit_id" value={product.unit_id} onChange={handleChange}>
                            {units.map((unit) => (
                                <MenuItem key={unit.id} value={unit.id}>{unit.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography>Gambar Produk</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={product.imageName}
                            placeholder="No File Chosen"
                            InputProps={{
                                readOnly: true,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Button
                                            variant="contained"
                                            component="label"
                                            sx={{
                                                bgcolor: "#E4E6EF",
                                                color: "black",
                                                borderRadius: "4px 0 0 4px",
                                                height: "38px",
                                                boxShadow: "none",
                                                textTransform: "none",
                                                "&:hover": { bgcolor: "#d1d3db" }
                                            }}
                                        >
                                            Choose File
                                            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                                        </Button>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ textAlign: "center", pt: 2 }}>
                <Button variant="contained" onClick={updateProduct}>Simpan</Button>
                <Button variant="contained" sx={{ ml: 2, bgcolor: "#E4E6EF", color: "black", "&:hover": { bgcolor: "#d1d3db" } }} onClick={CloseEvent}>Tutup</Button>
            </Box>
        </Box>
    );
}
