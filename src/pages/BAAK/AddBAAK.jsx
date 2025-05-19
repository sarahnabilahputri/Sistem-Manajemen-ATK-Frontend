import { useState } from "react";
import { Typography, Box, Grid, TextField, Button } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function AddBaak({ CloseEvent, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        nip: "",
        position: "Tendik",
        initial: "",
        role: "BAAK",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const createUser = async () => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/users`,
                {
                    ...formData,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    }
                }
            );

            if (response.status === 201) {
                CloseEvent();
                onSuccess?.();
                Swal.fire("Berhasil!", "BAAK berhasil ditambahkan.", "success");
            }
        } catch (error) {
            console.error("Error creating BAAK:", error);
            CloseEvent();
            Swal.fire("Error!", "Gagal menambahkan BAAK.", "error");
        }
    };

    return (
        <Box sx={{ maxWidth: 500, mx: "auto", bgcolor: "white", p: 2, borderRadius: 2 }}>
            <Box sx={{ width: "100%", textAlign: "center" }}>
                <Typography variant="h6">Form Tambah BAAK</Typography>
            </Box>
            <Box height={20} />
            <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Nama</Typography>
                        <TextField name="name" value={formData.name} onChange={handleChange} size="small" fullWidth />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Email</Typography>
                        <TextField name="email" value={formData.email} onChange={handleChange} size="small" fullWidth />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>NIP</Typography>
                        <TextField 
                            name="nip" 
                            value={formData.nip} 
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, ""); // Hanya angka
                                setFormData({ ...formData, nip: val.slice(0, 6) }); // Maksimal 6 digit
                            }} 
                            size="small" 
                            type="text" 
                            fullWidth 
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Posisi</Typography>
                        <TextField
                            name="position"
                            value={formData.position}
                            size="small"
                            fullWidth
                            disabled
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Inisial</Typography>
                        <TextField
                        name="initial"
                        value={formData.initial.toUpperCase()}
                        onChange={(e) => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
                            setFormData({ ...formData, initial: val.slice(0, 3) });
                        }}
                        size="small"
                        fullWidth
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Role</Typography>
                        <TextField
                            name="role"
                            value={formData.role}
                            size="small"
                            fullWidth
                            disabled
                        />
                    </Grid>
                </Grid>
            </Box>

            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                    <Typography variant="h5" align="center">
                        <Button variant="contained" onClick={createUser}>Simpan</Button>
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
        </Box>
    );
}
