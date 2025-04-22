import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

export default function EditKategori({ fid, CloseEvent, onSuccess }) {
    const [Kategori, setKategori] = useState("");

    useEffect(() => {
        if (fid && fid.id) {
            setKategori(fid.Kategori); 
            fetchKategoriById(fid.id); 
        }
    }, [fid]);

    const fetchKategoriById = async (id) => {
        try {
            const response = await axios.get(
                `https://910b-125-162-60-245.ngrok-free.app/api/categories/${id}`,
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                        "Accept": "application/json",
                    },
                }
            );
    
            const kategoriData = response.data.data;  
            setKategori(kategoriData.name);  
        } catch (error) {
            console.error("Error fetching category:", error);
            Swal.fire("Error!", "Gagal mengambil data kategori.", "error");
        }
    };
    
    const updateKategori = async () => {
        if (!Kategori.trim()) {
            CloseEvent(); 
            Swal.fire("Error!", "Kategori tidak boleh kosong.", "error");
            return;
        }
    
        try {
            const response = await axios.put(
                `https://910b-125-162-60-245.ngrok-free.app/api/categories/${fid.id}`, 
                { name: Kategori },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );
    
            if (response.status === 200) {
                CloseEvent(); 
                if (onSuccess) { 
                    onSuccess();
                }
                Swal.fire("Berhasil!", "Kategori telah diperbarui.", "success");
            }
        } catch (error) {
            CloseEvent(); 
            console.error("Error updating category:", error);
            Swal.fire("Error!", "Gagal memperbarui kategori.", "error");
        }
    };    

    return (
        <>
            <Box sx={{ width: "100%", textAlign: "center" }}> 
                <Typography variant="h6">Form Edit Kategori</Typography>
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
                        onChange={(e) => setKategori(e.target.value)} 
                        value={Kategori} 
                        sx={{ minWidth: "100%" }} 
                        InputLabelProps={{ shrink: false }} 
                    />
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography variant="h5" align="center">
                        <Button variant="contained" onClick={updateKategori}>
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
