import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button, MenuItem } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function AddStaff({ CloseEvent, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        nip: "",
        position: "",
        initial: "",
        role: "",
        study_program_id: "",
        phone_number: "",
    });

    const [studyPrograms, setStudyPrograms] = useState([]);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/study-programs`, {
            headers: {
                Accept: "application/json",
                "ngrok-skip-browser-warning": "true"
            }
        })
        .then((res) => {
            setStudyPrograms(res.data.data.data || []);
        })
        .catch((err) => console.error("Error fetching study programs:", err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        let updatedForm = { ...formData, [name]: value };

        if (name === "position") {
            if (value === "Dosen") {
                updatedForm.role = "Staff";
                updatedForm.study_program_id = "";
            } else if (value === "Rumah Tangga") {
                updatedForm.role = "Staff";
                updatedForm.phone_number = "";
            } else if (value === "Tendik") {
                updatedForm.role = "Staff";
                updatedForm.study_program_id = "";
            }
        }

        setFormData(updatedForm);
    };

    const createUser = async () => {
        const payload = {
            ...formData,
        };

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/users`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    }
                }
            );

            if (response.status === 201) {
                CloseEvent();
                if (onSuccess) onSuccess();
                Swal.fire("Berhasil!", "Staff berhasil ditambahkan.", "success");
            }
        } catch (error) {
    console.error("Error creating staff:", error);

        if (error.response?.status === 422 && error.response?.data?.errors) {
            const errorMessages = Object.values(error.response.data.errors)
                .flat()
                .join("\n");
            Swal.fire("Validasi Gagal", errorMessages, "error");
        } else {
            CloseEvent();
            Swal.fire("Error!", "Gagal menambahkan staff.", "error");
        }

        CloseEvent();
    }

    };

    return (
        <Box sx={{ maxWidth: 500, mx: "auto", bgcolor: "white", p: 2, borderRadius: 2 }}>
            <Box sx={{ width: "100%", textAlign: "center" }}>
                <Typography variant="h6">Form Tambah Staff</Typography>
            </Box>
            <Box height={20} />
            <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Nama</Typography>
                        <TextField name="name" value={formData.name} onChange={handleChange} size="small" fullWidth />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Email</Typography>
                        <TextField name="email" value={formData.email} onChange={handleChange} size="small" fullWidth />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>NIP</Typography>
                        <TextField 
                            name="nip" 
                            value={formData.nip} 
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, ""); 
                                setFormData({ ...formData, nip: val.slice(0, 6) }); 
                            }} 
                            size="small" 
                            type="text" 
                            fullWidth 
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
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
                            <MenuItem value="Rumah Tangga">Rumah Tangga</MenuItem>
                            <MenuItem value="Tendik">Tendik</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>Inisial </Typography>
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

                    <Grid size={{ xs: 12 }}>
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
                        <Grid size={{ xs: 12 }}>
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

                    {formData.position === "Rumah Tangga" && (
                        <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            Phone Number
                        </Typography>
                        <TextField
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            size="small"
                            fullWidth
                            placeholder="08xxxxxxxxxx"
                        />
                        </Grid>
                    )}
                </Grid>
            </Box>

            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12 }}>
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
