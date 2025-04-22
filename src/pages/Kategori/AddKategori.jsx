import { useState } from "react";
import { Typography, Box, Grid, TextField, Button } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

export default function AddKategori({ CloseEvent, onSuccess }) {
    const [Kategori, setKategori] = useState("");

    const handleKategoriChange = (event) => {
        setKategori(event.target.value);
    };

    const createUser = async () => {
        if (!Kategori.trim()) {
            CloseEvent(); 
            Swal.fire("Error!", "Kategori tidak boleh kosong.", "error");
            return;
        }

        try {
            const response = await axios.post(
                "https://910b-125-162-60-245.ngrok-free.app/api/categories",
                { name: Kategori }, 
                {
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );

            if (response.status === 201) {
                CloseEvent(); 
                if (onSuccess) { 
                    onSuccess();
                }
                Swal.fire("Berhasil!", "Kategori telah ditambahkan.", "success");
            }
        } catch (error) {
            CloseEvent(); 
            console.error("Error adding category:", error);
            Swal.fire("Error!", "Gagal menambahkan kategori.", "error");
        }
    };

    return (
        <>
            <Box sx={{ width: "100%", textAlign: "center" }}> 
                <Typography variant="h6">Form Tambah Kategori</Typography>
            </Box>
            <Box height={20} />
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Kategori
                    </Typography>
                    <TextField 
                        variant="outlined" 
                        size="small" 
                        onChange={handleKategoriChange} 
                        value={Kategori} 
                        sx={{ minWidth: "100%" }} 
                        InputLabelProps={{ shrink: false }} 
                    />
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography variant="h5" align="center">
                        <Button variant="contained" onClick={createUser}>
                            Simpan
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={CloseEvent} 
                            sx={{ ml: 1, bgcolor: "#E4E6EF", color: "black", "&:hover": { bgcolor: "#d1d3db" } }}>
                            Tutup
                        </Button>
                    </Typography>
                </Grid>
            </Grid>
        </>
    );
}
