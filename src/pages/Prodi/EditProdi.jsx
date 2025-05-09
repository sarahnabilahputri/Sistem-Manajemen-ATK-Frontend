import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

export default function EditProdi({ fid, CloseEvent, onSuccess }) {
    const [Prodi, setProdi] = useState("");

    useEffect(() => {
        if (fid && fid.id) {
            setProdi(fid.Prodi); 
            fetchProdiById(fid.id); 
        }
    }, [fid]);

    const fetchProdiById = async (id) => {
        try {
            const response = await axios.get(
                `https://80ea-125-165-106-71.ngrok-free.app/api/study-programs/${id}`,
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                        "Accept": "application/json",
                    },
                }
            );
    
            const prodiData = response.data.data;  
            setProdi(prodiData.name);  
        } catch (error) {
            console.error("Error fetching prodi:", error);
            Swal.fire("Error!", "Gagal mengambil data prodi.", "error");
        }
    };
    
    const updateProdi = async () => {
        if (!Prodi.trim()) {
            CloseEvent(); 
            Swal.fire("Error!", "Prodi tidak boleh kosong.", "error");
            return;
        }
    
        try {
            const response = await axios.put(
                `https://80ea-125-165-106-71.ngrok-free.app/api/study-programs/${fid.id}`, 
                { name: Prodi },
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
                Swal.fire("Berhasil!", "Prodi telah diperbarui.", "success");
            }
        } catch (error) {
            CloseEvent(); 
            console.error("Error updating prodi:", error);
            Swal.fire("Error!", "Gagal memperbarui prodi.", "error");
        }
    };    

    return (
        <>
            <Box sx={{ width: "100%", textAlign: "center" }}> 
                <Typography variant="h6">Form Edit Prodi</Typography>
            </Box>
            <Box height={20} />
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Prodi
                    </Typography>
                    <TextField 
                        variant="outlined" 
                        size="small" 
                        onChange={(e) => setProdi(e.target.value)} 
                        value={Prodi} 
                        sx={{ minWidth: "100%" }} 
                        InputLabelProps={{ shrink: false }} 
                    />
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography variant="h5" align="center">
                        <Button variant="contained" onClick={updateProdi}>
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
