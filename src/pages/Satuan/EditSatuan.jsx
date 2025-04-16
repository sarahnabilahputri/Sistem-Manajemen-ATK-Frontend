import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

export default function EditSatuan({ fid, CloseEvent, onSuccess }) {
    const [Unit, setUnit] = useState("");

    useEffect(() => {
        if (fid && fid.id) {
            setUnit(fid.Unit); 
            fetchUnitById(fid.id); 
        }
    }, [fid]);

    const fetchUnitById = async (id) => {
        try {
            const response = await axios.get(
                `https://f389-125-165-106-98.ngrok-free.app/api/units/${id}`,
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                        "Accept": "application/json",
                    },
                }
            );
    
            const unitData = response.data.data;  
            setUnit(unitData.name);  
        } catch (error) {
            console.error("Error fetching unit:", error);
            Swal.fire("Error!", "Gagal mengambil data satuan.", "error");
        }
    };
    
    const updateUnit = async () => {
        if (!Unit.trim()) {
            CloseEvent(); 
            Swal.fire("Error!", "Unit tidak boleh kosong.", "error");
            return;
        }
    
        try {
            const response = await axios.put(
                `https://f389-125-165-106-98.ngrok-free.app/api/units/${fid.id}`, 
                { name: Unit },
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
                Swal.fire("Berhasil!", "Satuan telah diperbarui.", "success");
            }
        } catch (error) {
            CloseEvent(); 
            console.error("Error updating unit:", error);
            Swal.fire("Error!", "Gagal memperbarui satuan.", "error");
        }
    };    

    return (
        <>
            <Box sx={{ width: "100%", textAlign: "center" }}> 
                <Typography variant="h6">Form Edit Satuan</Typography>
            </Box>
            <Box height={20} />
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Satuan
                    </Typography>
                    <TextField 
                        variant="outlined" 
                        size="small" 
                        onChange={(e) => setUnit(e.target.value)} 
                        value={Unit} 
                        sx={{ minWidth: "100%" }} 
                        InputLabelProps={{ shrink: false }} 
                    />
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography variant="h5" align="center">
                        <Button variant="contained" onClick={updateUnit}>
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
