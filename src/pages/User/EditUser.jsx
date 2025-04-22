// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   TextField,
//   MenuItem,
//   Button,
//   Stack,
//   Typography,
// } from "@mui/material";
// import axios from "axios";

// export default function EditUser({ CloseEvent, userData, onSuccess }) {
//   const [studyPrograms, setStudyPrograms] = useState([]);
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     nip: "",
//     position: "",
//     initial: "",
//     role: "",
//     study_program_id: "",
//   });

//   useEffect(() => {
//     axios
//       .get("https://dbca-125-165-106-98.ngrok-free.app/api/study-programs", {
//         headers: {
//           "ngrok-skip-browser-warning": "true",
//         },
//       })
//       .then((res) => {
//         console.log("Study Programs:", res.data); // cek output ini di console
//         setStudyPrograms(res.data.data); // pastikan ini array
//       })
//       .catch((err) => console.error("Failed fetching study programs", err));
//   }, []);
  

//   useEffect(() => {
//     // Isi data dari userData ketika modal dibuka
//     if (userData) {
//       setFormData({
//         name: userData.name || "",
//         email: userData.email || "",
//         nip: userData.nip || "",
//         position: userData.position || "",
//         initial: userData.initial || "",
//         role: userData.role || "",
//         study_program_id: userData.study_program_id || "",
//       });
//     }
//   }, [userData]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       await axios.put(
//         `https://dbca-125-165-106-98.ngrok-free.app/api/users/${userData.id}`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             "ngrok-skip-browser-warning": "true",
//           },
//         }
//       );
//       onSuccess(); // Refresh user list
//       CloseEvent(); // Tutup modal
//     } catch (error) {
//       console.error("Failed to update user", error);
//     }
//   };

//   return (
//     <Box component="form" onSubmit={handleSubmit}>
//       <Typography variant="h6" mb={2}>
//         Edit Data User
//       </Typography>
//       <Stack spacing={2}>
//         <TextField
//           label="Nama"
//           name="name"
//           fullWidth
//           value={formData.name}
//           onChange={handleChange}
//         />
//         <TextField
//           label="Email"
//           name="email"
//           fullWidth
//           value={formData.email}
//           onChange={handleChange}
//         />
//         <TextField
//           label="NIP"
//           name="nip"
//           fullWidth
//           value={formData.nip}
//           onChange={handleChange}
//         />
//         <TextField
//           label="Jabatan"
//           name="position"
//           fullWidth
//           value={formData.position}
//           onChange={handleChange}
//         />
//         <TextField
//           label="Inisial"
//           name="initial"
//           fullWidth
//           value={formData.initial}
//           onChange={handleChange}
//         />
//         <TextField
//           label="Role"
//           name="role"
//           select
//           fullWidth
//           value={formData.role}
//           onChange={handleChange}
//         >
//           <MenuItem value="admin">Admin</MenuItem>
//           <MenuItem value="user">User</MenuItem>
//         </TextField>
//         <TextField
//         label="Program Studi"
//         name="study_program_id"
//         select
//         fullWidth
//         value={formData.study_program_id}
//         onChange={handleChange}
//         >
//         {Array.isArray(studyPrograms) &&
//             studyPrograms.map((program) => (
//             <MenuItem key={program.id} value={program.id}>
//                 {program.name}
//             </MenuItem>
//             ))}
//         </TextField>


//         <Stack direction="row" spacing={2} justifyContent="flex-end">
//           <Button onClick={CloseEvent} color="inherit">
//             Batal
//           </Button>
//           <Button type="submit" variant="contained">
//             Simpan
//           </Button>
//         </Stack>
//       </Stack>
//     </Box>
//   );
// }
