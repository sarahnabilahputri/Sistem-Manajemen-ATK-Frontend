import { useState, useEffect } from "react";
import { Typography, Box, Grid, TextField, Button, MenuItem } from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function EditStaff({ fid, CloseEvent, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        nip: "",
        position: "",
        initial: "",
        role: "Staff",
        study_program_id: "",
        phone_number: "",
    });

    const [studyPrograms, setStudyPrograms] = useState([]);

    const fetchStudyPrograms = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/study-programs`, {
            headers: {
                Accept: "application/json",
                "ngrok-skip-browser-warning": "true",
            },
            });
            console.log("Response data:", response.data);
            setStudyPrograms(response.data.data.data || []);
        } catch (error) {
            console.error("Error fetching study programs:", error);
            console.log("Error response:", error.response?.data);
        }
    };

    // --- REPLACE fetchStaffById function AND the useEffect below with this ---

    // robust fetchStaffById: normalisasi response dan fallback ke prev state
    const fetchStaffById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/users/${id}`, {
        headers: { Accept: "application/json", "ngrok-skip-browser-warning": "true" }
        });
        console.log("Detail staff response (raw):", response.data);

        // Normalize payload (support beberapa bentuk response)
        const root = response.data ?? {};
        const maybeData = root.data ?? root;
        let user;
        if (maybeData && maybeData.id) {
        user = maybeData;
        } else if (Array.isArray(maybeData?.data) && maybeData.data.length) {
        user = maybeData.data[0];
        } else if (Array.isArray(maybeData) && maybeData.length) {
        user = maybeData[0];
        } else {
        user = maybeData || {};
        }

        // Merge ke formData tanpa menimpa dengan `null` — pakai prev sebagai fallback
        setFormData(prev => ({
        name: user.name ?? prev.name ?? "",
        email: user.email ?? prev.email ?? "",
        nip: user.nip ?? prev.nip ?? "",
        position: user.position ?? prev.position ?? "",
        initial: user.initial ?? prev.initial ?? "",
        role: user.role ?? prev.role ?? "Staff",
        study_program_id: user.study_program_id ?? prev.study_program_id ?? "",
        phone_number: user.phone_number ?? prev.phone_number ?? "",
        }));
    } catch (error) {
        CloseEvent();
        console.error("Error fetching staff:", error, error?.response?.data);
        Swal.fire("Error!", "Gagal mengambil data staff.", "error");
    }
    };

    // segera isi form dari fid (optimistic) lalu fetch server untuk refresh
    useEffect(() => {
    if (fid && typeof fid === "object" && fid.id) {
        // isi cepat dari data yang dikirim parent supaya user langsung lihat
        setFormData(prev => ({
        ...prev,
        name: fid.name ?? prev.name,
        email: fid.email ?? prev.email,
        nip: fid.nip ?? prev.nip,
        position: fid.position ?? prev.position,
        initial: fid.initial ?? prev.initial,
        role: fid.role ?? prev.role,
        study_program_id: fid.study_program_id ?? prev.study_program_id,
        phone_number: fid.phone_number ?? prev.phone_number,
        }));

        // ambil versi server utk memastikan data paling baru
        fetchStaffById(fid.id);
    } else {
        // jika fid kosong, tetap panggil study programs
    }
    fetchStudyPrograms();
    }, [fid]);

    // const fetchStaffById = async (id) => {
    //     try {
    //         const response = await axios.get(
    //         `${API_BASE_URL}/api/users/${id}`,
    //         {
    //             headers: {
    //             Accept: "application/json",
    //             "ngrok-skip-browser-warning": "true"
    //             }
    //         }
    //         );
    //         console.log("Detail staff response:", response.data);
    //         const payload = response.data.data;
    //         const user = payload.id
    //         ? payload
    //         : Array.isArray(payload.data) && payload.data.length
    //             ? payload.data[0]
    //             : {};
    //         setFormData({
    //             name: user.name || "",
    //             email: user.email || "",
    //             nip: user.nip || "",
    //             position: user.position || "",
    //             initial: user.initial || "",
    //             role: user.role || "Staff",
    //             study_program_id: user.study_program_id || "",
    //             phone_number: user.phone_number || "",
    //         });
    //     } catch (error) {
    //         CloseEvent();
    //         console.error("Error fetching staff:", error);
    //         Swal.fire("Error!", "Gagal mengambil data staff.", "error");
    //     }
    // };

    // useEffect(() => {
    //     if (fid?.id) {
    //         fetchStaffById(fid.id);
    //     }
    //     fetchStudyPrograms();
    // }, [fid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updated = { ...formData, [name]: value };

        if (name === "position") {
            updated.role = "Staff";
            updated.study_program_id = "";
            if (value !== "Rumah Tangga") updated.phone_number = "";
        }

        setFormData(updated);
    };

    const updateStaff = async () => {
        const { name, email, nip, initial, position, study_program_id, phone_number } = formData;
        if (!name || !email || !nip || !initial) {
            Swal.fire("Error!", "Semua kolom harus diisi.", "error");
            return;
        }

        const token = `${localStorage.getItem("token_type")} ${localStorage.getItem("access_token")}`;
        console.log("Token di EditStaff.jsx:", token);

        try {
            const response = await axios({
                method: "patch",
                url: `${API_BASE_URL}/api/users/${fid.id}`,
                data: {
                    name,
                    email,
                    nip,
                    initial,
                    position,
                    role: "Staff",
                    study_program_id: position === "Dosen" ? study_program_id : null,
                    phone_number: position === "Rumah Tangga" ? phone_number : null,
                },
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "ngrok-skip-browser-warning": "true",
                    "Authorization": token,
                    "X-HTTP-Method-Override": "PATCH",
                },
            });

            if (response.status === 200) {
                CloseEvent();
                Swal.fire("Berhasil!", "Staff berhasil diperbarui.", "success").then(() => onSuccess());
            }
        } catch (error) {
            CloseEvent();
            console.error("Error updating staff:", error);
            Swal.fire("Error!", "Gagal memperbarui staff.", "error");
        }
    };

    return (
        <Box sx={{ maxWidth: 500, mx: "auto", bgcolor: "white", p: 2, borderRadius: 2 }}>
            <Typography variant="h6" align="center"  sx={{ mb:2 }}>Form Edit Staff</Typography>
            <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Typography sx={{ mb:1 }}>Nama</Typography>
                        <TextField name="name" value={formData.name} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography sx={{ mb:1 }}>Email</Typography>
                        <TextField name="email" value={formData.email} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography sx={{ mb:1 }}>NIP</Typography>
                        <TextField name="nip" value={formData.nip} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography sx={{ mb:1 }}>Posisi</Typography>
                        <TextField name="position" value={formData.position} onChange={handleChange} select fullWidth size="small" disabled>
                            <MenuItem value="Dosen">Dosen</MenuItem>
                            <MenuItem value="Rumah Tangga">Rumah Tangga</MenuItem>
                            <MenuItem value="Tendik">Tendik</MenuItem>
                            
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography sx={{ mb:1 }}>Inisial</Typography>
                        <TextField name="initial" value={formData.initial} onChange={handleChange} fullWidth size="small" />
                    </Grid>
                    {formData.position === "Dosen" && (
                        <Grid size={{ xs: 12 }}>
                            <Typography sx={{ mb:1 }}>Program Studi</Typography>
                            <TextField name="study_program_id" value={formData.study_program_id} onChange={handleChange} select fullWidth size="small">
                                {studyPrograms.map((prog) => (
                                    <MenuItem key={prog.id} value={prog.id}>{prog.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    )}
                    {formData.position === "Rumah Tangga" && (
                        <Grid size={{ xs: 12 }}>
                        <Typography sx={{ mb:1 }}>Phone Number</Typography>
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
            <Box sx={{ textAlign: "center", pt: 2 }}>
                <Button variant="contained" onClick={updateStaff}>Simpan</Button>
                <Button variant="contained" sx={{ ml: 2, bgcolor: "#E4E6EF", color: "black" }} onClick={CloseEvent}>Tutup</Button>
            </Box>
        </Box>
    );
}
