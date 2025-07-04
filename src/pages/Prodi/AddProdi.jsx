import { useState } from "react";
import { Typography, Box, Grid, TextField, Button } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function AddProdi({ CloseEvent, onSuccess }) {
    const [Prodi, setProdi] = useState("");

    const handleProdiChange = (event) => {
        setProdi(event.target.value);
    };

    const createUser = async () => {
        if (!Prodi.trim()) {
            CloseEvent(); 
            Swal.fire("Error!", "Prodi tidak boleh kosong.", "error");
            return;
        }

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/study-programs`,
                { name: Prodi }, 
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
                Swal.fire("Berhasil!", "Prodi telah ditambahkan.", "success");
            }
        } catch (error) {
            CloseEvent(); 
            console.error("Error adding prodi:", error);
            Swal.fire("Error!", "Gagal menambahkan prodi.", "error");
        }
    };

    return (
        <>
            <Box sx={{ width: "100%", textAlign: "center" }}> 
                <Typography variant="h6">Form Tambah Prodi</Typography>
            </Box>
            <Box height={20} />
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Prodi
                    </Typography>
                    <TextField 
                        variant="outlined" 
                        size="small" 
                        onChange={handleProdiChange} 
                        value={Prodi} 
                        sx={{ minWidth: "100%" }} 
                        InputLabelProps={{ shrink: false }} 
                    />
                </Grid>
                <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
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
