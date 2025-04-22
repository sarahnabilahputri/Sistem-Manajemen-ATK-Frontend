import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button, MenuItem } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

export default function AddUser({ CloseEvent, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        nip: "",
        position: "",
        initial: "",
        role: "Dosen",
        study_program_id: null,
    });

    const [studyPrograms, setStudyPrograms] = useState([]);

    useEffect(() => {
        axios.get("https://910b-125-162-60-245.ngrok-free.app/api/study-programs", {
            headers: {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            }
        })
        .then((response) => {
            console.log("Study programs response:", response.data);
            setStudyPrograms(response.data.data.data || []); // <--- perbaikan di sini
        })
        .catch((error) => {
            console.error("Error fetching study programs:", error);
        });
    }, []);
    

    const handleChange = (e) => {
        const { name, value } = e.target;
    
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    

    const createUser = async () => {
        const payload = {
            ...formData,
            role: formData.role.toLowerCase(), // 'Dosen' -> 'dosen'
        };
        console.log("Data yang dikirim:", formData);
        try {
            const response = await axios.post(
                "https://910b-125-162-60-245.ngrok-free.app/api/users",
                formData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );

            if (response.status === 201) {
                CloseEvent();
                if (onSuccess) onSuccess();
                Swal.fire("Berhasil!", "User berhasil ditambahkan.", "success");
            }
        } catch (error) {
            console.error("Error creating user:", error.response?.data || error);
            CloseEvent();
            Swal.fire("Error!", "Gagal menambahkan user.", "error");
        }
    };

    return (
        <>
            <Box sx={{ width: "100%", textAlign: "center" }}>
                <Typography variant="h6">Form Tambah Pengguna</Typography>
            </Box>
            <Box height={20} />
            <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
            <Box sx={{ maxWidth: 500, mx: "auto" }}>
            <Grid container spacing={2}>
                <Grid item xs={12}><Typography variant="body1" sx={{ mb: 1 }}>Nama</Typography>
                    <TextField name="name" value={formData.name} onChange={handleChange} size="small" fullWidth />
                </Grid>

                <Grid item xs={12}><Typography variant="body1" sx={{ mb: 1 }}>Email</Typography>
                    <TextField name="email" value={formData.email} onChange={handleChange} size="small" fullWidth />
                </Grid>

                <Grid item xs={12}><Typography variant="body1" sx={{ mb: 1 }}>NIP</Typography>
                    <TextField name="nip" value={formData.nip} onChange={handleChange} size="small" type="number" fullWidth />
                </Grid>

                <Grid item xs={12}><Typography variant="body1" sx={{ mb: 1 }}>Posisi</Typography>
                    <TextField
                        name="position"
                        select
                        value={formData.position}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                    >
                        <MenuItem value="Dosen">Dosen</MenuItem>
                        <MenuItem value="Non Dosen">Non Dosen</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12}><Typography variant="body1" sx={{ mb: 1 }}>Inisial (3 huruf)</Typography>
                    <TextField name="initial" value={formData.initial} onChange={handleChange} size="small" inputProps={{ maxLength: 3 }} fullWidth />
                </Grid>

                <Grid item xs={12}><Typography variant="body1" sx={{ mb: 1 }}>Role</Typography>
                    <TextField
                        name="role"
                        select
                        value={formData.role}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                    >
                        <MenuItem value="Dosen">Dosen</MenuItem>
                        <MenuItem value="BAAK">BAAK</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12}><Typography variant="body1" sx={{ mb: 1 }}>Program Studi</Typography>
                    <TextField
                        name="study_program_id"
                        select
                        value={formData.study_program_id || ""}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                    >
                        <MenuItem value="">Tidak Ada</MenuItem>
                        {studyPrograms.map((prog) => (
                            <MenuItem key={prog.id} value={prog.id}>{prog.name}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                </Grid>
                </Box>
            </Box>
                
            {/* Tombol bawah */}
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
            
        </>
    );
}
