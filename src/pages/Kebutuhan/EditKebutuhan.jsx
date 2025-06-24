import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function EditKebutuhan({ fid, CloseEvent, onSuccess }) {
    const [Kebutuhan, setKebutuhan] = useState("");

    useEffect(() => {
        if (fid && fid.id) {
            setKebutuhan(fid.Kebutuhan); 
            fetchKebutuhanById(fid.id); 
        }
    }, [fid]);

    const fetchKebutuhanById = async (id) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/purposes/${id}`,
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                        "Accept": "application/json",
                    },
                }
            );
    
            const kebutuhanData = response.data.data;  
            setKebutuhan(kebutuhanData.name);  
        } catch (error) {
            console.error("Error fetching Kebutuhan:", error);
            Swal.fire("Error!", "Gagal mengambil data kebutuhan.", "error");
        }
    };
    
    const updateKebutuhan = async () => {
        if (!Kebutuhan.trim()) {
            CloseEvent(); 
            Swal.fire("Error!", "Kebutuhan tidak boleh kosong.", "error");
            return;
        }
    
        try {
            const response = await axios.put(
                `${API_BASE_URL}/api/purposes/${fid.id}`, 
                { name: Kebutuhan },
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
                Swal.fire("Berhasil!", "Kebutuhan telah diperbarui.", "success");
            }
        } catch (error) {
            CloseEvent(); 
            console.error("Error updating kebutuhan:", error);
            Swal.fire("Error!", "Gagal memperbarui kebutuhan.", "error");
        }
    };    

    return (
        <>
            <Box sx={{ width: "100%", textAlign: "center" }}> 
                <Typography variant="h6">Form Edit Kebutuhan</Typography>
            </Box>
            <Box height={20} />
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Kebutuhan
                    </Typography>
                    <TextField 
                        variant="outlined" 
                        size="small" 
                        onChange={(e) => setKebutuhan(e.target.value)} 
                        value={Kebutuhan} 
                        sx={{ minWidth: "100%" }} 
                        InputLabelProps={{ shrink: false }} 
                    />
                </Grid>
                <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                    <Typography variant="h5" align="center">
                        <Button variant="contained" onClick={updateKebutuhan}>
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
