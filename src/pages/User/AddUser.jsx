import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button, MenuItem } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function AddUser({ CloseEvent, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        nip: "",
        position: "",
        initial: "",
        role: "",
        study_program_id: "",
    });

    const [studyPrograms, setStudyPrograms] = useState([]);

    useEffect(() => {
        axios.get( `${API_BASE_URL}/api/study-programs`, {
            headers: {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            }
        })
        .then((response) => {
            console.log("Study programs response:", response.data);
            setStudyPrograms(response.data.data.data || []); 
        })
        .catch((error) => {
            console.error("Error fetching study programs:", error);
        });
    }, []);
    

    const handleChange = (e) => {
        const { name, value } = e.target;

        let updatedForm = {
            ...formData,
            [name]: value,
        };

        if (name === "position") {
            if (value === "Dosen") {
                updatedForm.role = "Staff";
                updatedForm.study_program_id = "";
            } else if (value === "Tendik") {
                updatedForm.role = "BAAK";
                updatedForm.study_program_id = "";
            } else if (value === "Rumah Tangga") {
                updatedForm.role = "Staff";
                updatedForm.study_program_id = "";
            }
        }

        setFormData(updatedForm);
    };
    

    const createUser = async () => {
        const payload = {
            ...formData,
            role: formData.role.toLowerCase(), 
        };
        console.log("Data yang dikirim:", formData);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/users`,
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
        <Box sx={{ maxWidth: 500, mx: "auto", bgcolor: "white", p: 2, borderRadius: 2 }}>
            <Box sx={{ width: "100%", textAlign: "center" }}>
                <Typography variant="h6">Form Tambah Pengguna</Typography>
            </Box>
            <Box height={20} />
            <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
            <Grid container spacing={2} >
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
                    <TextField name="nip" value={formData.nip} onChange={handleChange} size="small" type="number" fullWidth />
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 1 }}>Posisi</Typography>
                    <TextField
                        name="position"
                        select
                        value={formData.position}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                    >
                        <MenuItem value="Dosen">Dosen</MenuItem>
                        <MenuItem value="Tendik">Tendik</MenuItem>
                        <MenuItem value="Rumah Tangga">Rumah Tangga</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 1 }}>Inisial (3 huruf)</Typography>
                    <TextField name="initial" value={formData.initial} onChange={handleChange} size="small" inputProps={{ maxLength: 3 }} fullWidth />
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

                {formData.position === "Dosen" && (
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Program Studi</Typography>
                        <TextField
                            name="study_program_id"
                            select
                            value={formData.study_program_id}
                            onChange={handleChange}
                            size="small"
                            fullWidth
                        >
                            {studyPrograms.map((prog) => (
                                <MenuItem key={prog.id} value={prog.id}>
                                    {prog.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                )}
                </Grid>
                </Box>
            {/* </Box> */}
                
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
        </Box>      
        </>
    );
}
