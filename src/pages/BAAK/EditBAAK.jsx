import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function EditBaak({ fid, CloseEvent, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        nip: "",
        position: "Tendik",
        initial: "",
        role: "BAAK",
    });

    const [loading, setLoading] = useState(true);

    const fetchBaakById = async (id) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/users/${id}`,
                { headers: { "ngrok-skip-browser-warning": "true", "Accept": "application/json" } }
            );

            const data = response.data.data;
            setFormData({
                name: data.name,
                email: data.email,
                nip: data.nip,
                position: data.position,
                initial: data.initial,
                role: data.role,
            });
        } catch (error) {
            console.error("❌ Error fetching BAAK:", error);
            Swal.fire("Error!", "Gagal mengambil data BAAK.", "error");
        }
    };

    useEffect(() => {
        if (fid?.id) {
            fetchBaakById(fid.id);
            setLoading(false);
        }
    }, [fid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const updateBaak = async () => {
        const { name, email, nip, initial } = formData;

        if (!name || !email || !nip || !initial) {
            Swal.fire("Error!", "Semua kolom harus diisi.", "error");
            return;
        }

        const token = `${localStorage.getItem("token_type")} ${localStorage.getItem("access_token")}`;

        try {
            const response = await axios({
                method: "post",
                url: `${API_BASE_URL}/api/users/${fid.id}`,
                data: formData,
                headers: {
                    "ngrok-skip-browser-warning": "true",
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "X-HTTP-Method-Override": "PATCH",
                    "Authorization": token,
                }
            });

            if (response.status === 200) {
                CloseEvent();
                Swal.fire("Berhasil!", "BAAK telah diperbarui.", "success").then(() => {
                    onSuccess();
                });
            }
        } catch (error) {
            console.error("❌ Error updating BAAK:", error);
            Swal.fire("Error!", "Gagal memperbarui BAAK.", "error");
        }
    };

    return (
        <Box sx={{ maxWidth: 500, mx: "auto", bgcolor: "white", p: 2, borderRadius: 2 }}>
            <Typography variant="h6" align="center" >Form Edit BAAK</Typography>
            <Box sx={{ maxHeight: "50vh", overflowY: "auto", pr: 1 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography>Nama</Typography>
                        <TextField name="name" value={formData.name} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography>Email</Typography>
                        <TextField name="email" value={formData.email} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography>NIP</Typography>
                        <TextField 
                            name="nip" 
                            value={formData.nip} 
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, ""); 
                                setFormData({ ...formData, nip: val.slice(0, 6) }); 
                            }} 
                            fullWidth 
                            size="small" 
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography>Posisi</Typography>
                        <TextField
                            name="position"
                            value={formData.position}
                            size="small"
                            fullWidth
                            disabled
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography>Inisial</Typography>
                        <TextField 
                            name="initial" 
                            value={formData.initial.toUpperCase()} 
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, ""); 
                                setFormData({ ...formData, initial: val.slice(0, 3) }); 
                            }} 
                            fullWidth 
                            size="small" 
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography>Role</Typography>
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
            <Box sx={{ textAlign: "center", pt: 2 }}>
                <Button variant="contained" onClick={updateBaak}>Simpan</Button>
                <Button variant="contained" sx={{ ml: 2, bgcolor: "#E4E6EF", color: "black", "&:hover": { bgcolor: "#d1d3db" } }} onClick={CloseEvent}>Tutup</Button>
            </Box>
        </Box>
    );
}
