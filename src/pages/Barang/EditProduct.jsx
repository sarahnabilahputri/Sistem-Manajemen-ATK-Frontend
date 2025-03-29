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
        unit: "",
        category_id: "",
        image: null, 
        imageName: "No File Choosen",
    });

    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        console.log("fid yang diterima:", fid);

        if (fid && fid.id) {
            fetchProductById(fid.id);
        }
    }, [fid]);

    const fetchProductById = async (id) => {
        try {
            const response = await axios.get(
                `https://09eb-2001-448a-1041-de18-ddb1-d520-4318-2c3.ngrok-free.app/api/products/${id}`,
                { headers: { "ngrok-skip-browser-warning": "true", "Accept": "application/json" } }
            );
    
            const data = response.data.data;
            console.log("Data produk:", data);
    
            let fullImageUrl = null;
            if (data.image) {
                fullImageUrl = `https://09eb-2001-448a-1041-de18-ddb1-d520-4318-2c3.ngrok-free.app/storage/${data.image}`;
            }
    
            setProduct({
                name: data.name,
                stock: data.stock.toString(),
                price: data.price.toString(),
                unit: data.unit_id,
                category_id: data.category_id,
                image: null, // Untuk upload baru
                imageName: data.image || "No File Choosen", // ✅ Menampilkan nama file gambar
            });
                      
    
            setImagePreview(fullImageUrl);
            console.log("✅ Image Preview URL:", fullImageUrl);
    
        } catch (error) {
            console.error("❌ Error fetching product:", error);
            Swal.fire("Error!", "Gagal mengambil data produk.", "error");
        }
    };    
    
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get("https://09eb-2001-448a-1041-de18-ddb1-d520-4318-2c3.ngrok-free.app/api/categories", {
                    headers: { "ngrok-skip-browser-warning": "true", "Accept": "application/json" },
                });
                setCategories(response.data?.data?.data || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        const fetchUnits = async () => {
            try {
                const response = await axios.get("https://09eb-2001-448a-1041-de18-ddb1-d520-4318-2c3.ngrok-free.app/api/units", {
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
        if (!loading && fid && fid.id) {
            fetchProductById(fid.id);
        }
    }, [loading]);

    const handleChange = (event) => {
        setProduct({ ...product, [event.target.name]: event.target.value });
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProduct({
                ...product,
                image: file,
                imageName: file.name, // ✅ Perbarui nama file yang ditampilkan di TextField
            });
            setImagePreview(URL.createObjectURL(file)); // Menampilkan preview gambar
        }
    };
    

    const updateProduct = async () => {
        if (!product.name.trim() || !product.stock.trim() || !product.price.trim() || !product.category_id.trim() || !product.unit.trim()) {
            Swal.fire("Error!", "Semua kolom harus diisi.", "error");
            return;
        }
    
        try {
            const formData = new FormData();
            formData.append("name", product.name);
            formData.append("stock", product.stock);
            formData.append("price", product.price);
            formData.append("unit_id", product.unit); // Pastikan ini adalah ID unit yang benar
            formData.append("category_id", product.category_id);
            
            if (product.image) {
                formData.append("image", product.image);
            }
    
            console.log("Data yang akan dikirim:", {
                name: product.name,
                stock: product.stock,
                price: product.price,
                unit_id: product.unit,
                category_id: product.category_id,
                image: product.image,
            });
    
            const response = await axios.put(
                `https://09eb-2001-448a-1041-de18-ddb1-d520-4318-2c3.ngrok-free.app/api/products/${fid.id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data", "ngrok-skip-browser-warning": "true" } }
            );
    
            console.log("📥 Server response:", response.data);
            
            if (response.status === 200) {
                Swal.fire("Berhasil!", "Produk telah diperbarui.", "success").then(() => {
                    window.location.reload();
                    CloseEvent();
                });
            }
            
        } catch (error) {
            console.error("Error updating product:", error);
            if (error.response) {
                console.error("Server responded with:", error.response.data);
            }
            Swal.fire("Error!", "Gagal memperbarui produk.", "error");
        }
    };

    return (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ width: "100%", textAlign: "center", pb: 2 }}>
                <Typography variant="h6">Form Edit Produk</Typography>
            </Box>

            {/* Scrollable Form Container */}
            <Box sx={{ maxHeight: "50vh", overflowY: "auto", p: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Nama Produk</Typography>
                        <TextField variant="outlined" size="small" name="name" onChange={handleChange} value={product.name} sx={{ minWidth: "100%" }} />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Kategori</Typography>
                        <TextField select variant="outlined" size="small" name="category_id" onChange={handleChange} 
                            value={categories.some(cat => cat.id === product.category_id) ? product.category_id : ""}
                            sx={{ minWidth: "100%" }}>
                            {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
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

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Unit</Typography>
                        <TextField select variant="outlined" size="small" name="unit" onChange={handleChange} 
                            value={units.some(unit => unit.id === product.unit) ? product.unit : ""}
                            sx={{ minWidth: "100%" }}>
                            {units.map((unit) => <MenuItem key={unit.id} value={unit.id}>{unit.name}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Gambar Produk</Typography>
                        <TextField
                            variant="outlined"
                            size="small"
                            value={product.imageName || ""} // ✅ Menampilkan nama file gambar
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

            {/* Footer Buttons */}
            <Box sx={{ width: "100%", textAlign: "center", pt: 2 }}>
                <Button variant="contained" onClick={updateProduct}>Simpan</Button>
                <Button variant="contained" onClick={CloseEvent} sx={{ ml: 1, bgcolor: "#E4E6EF", color: "black", "&:hover": { bgcolor: "#d1d3db" } }}>Tutup</Button>
            </Box>
        </Box>
    );
}
