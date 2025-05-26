import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRef } from 'react'; 
import axios from 'axios';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Modal from '@mui/material/Modal';
import AddStaff from './AddStaff';
import EditStaff from './EditStaff';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  borderRadius: "12px",
  boxShadow: 24,
  border: "none",
  p: 4,
};

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function StafList() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [formid, setFormid] = useState("");
  const [editopen, setEditOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const handleOpen = () => setOpen(true);
  const handleEditOpen = () => setEditOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditClose = () => setEditOpen(false);

  const fetchUsers = (pageArg = 1, limitArg = rowsPerPage) => {
    axios.get(`${API_BASE_URL}/api/users?page=${pageArg}&limit=${limitArg}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      }
    })
    .then((response) => {
      const data = response.data.data;
      const items = data.data
        .filter((user) => user.role === 'Staff')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const formattedRows = items.map((user) => ({

        id: user.id,
        name: user.name,
        email: user.email,
        nip: user.nip,
        position: user.position,
        initial: user.initial,
        role: user.role,
        study_program_id: user.study_program_id
      }));
      setRows(formattedRows);
      setAllRows(formattedRows);
      setTotalItems(items.length);
    })
    .catch((error) => {
      console.error('Error fetching users:', error);
      setError(error);
    });
  };

  const handleClickImport = () => {
    fileInputRef.current.click();                  
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return Swal.fire("Error", "File harus berformat .xlsx", "error");
    }

    const formData = new FormData();
    formData.append("file", file);                   

    try {
      setImporting(true);
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_BASE_URL}/api/import-user`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );
      Swal.fire("Success", "Import user berhasil", "success");
      fetchUsers();                             
    } catch (err) {
      const errorData = err.response?.data;
      let msg = errorData?.message || "Gagal import user";

      if (Array.isArray(errorData?.errors)) {
        msg = errorData.errors.join("\n");
      }

      else if (errorData?.errors && typeof errorData.errors === "object") {
        msg = Object.values(errorData.errors).flat().join("\n");
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        html: `<div style="
          color: #666;            /* abu-abu */
          font-size: 0.85rem;     /* lebih kecil */
          white-space: pre-line;  /* agar \n jadi baris baru */
        ">${msg}</div>`,
      });
    } finally {
      setImporting(false);
      e.target.value = null;                       
    }
  };

  useEffect(() => {
    fetchUsers(1, rowsPerPage);
  }, []);

  const deleteUser = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.value) {
        deleteApi(id);
      }
    });
  };

  const deleteApi = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`);
      Swal.fire("Deleted!", "User has been deleted.", "success");
      setRows(rows.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const editData = (user) => {
    setFormid(user);
    handleEditOpen();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchUsers(newPage + 1, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newLimit = +event.target.value;
    setRowsPerPage(newLimit);
    setPage(0);
    fetchUsers(1, newLimit);
  };

  const filterData = (v) => {
    if (v) {
      setRows([v]);
    } else {
      setRows(allRows);
    }
  };

  if (error) return <div>Error: {error.message}</div>;

  return (
    <>
      <div>
      <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: 400, 
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              p: 3,
              overflowY: 'auto',
              maxHeight: '100vh',
            }}
          >
            <AddStaff CloseEvent={handleClose} onSuccess={fetchUsers} />
          </Box>
        </Modal>
        <Modal open={editopen} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
          <Box sx={style}>
            <EditStaff CloseEvent={handleEditClose} fid={formid} onSuccess={fetchUsers} />
          </Box>
        </Modal>
      </div>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, mr: 2.5 }}>
        <Button
          variant="contained"
          onClick={handleClickImport}
          disabled={importing}
          startIcon={
            <Box
              component="img"
              src="/Icon/import.png"      // dari public/icon/import.png
              alt="Import"
              sx={{ width: 15, height: 15 }}
            />
          }
          sx={{
            mr: 1,
            bgcolor: "#09C690",
            color: "white",
            textTransform: 'capitalize',
            "&:hover": { bgcolor: "#07a574" },
          }}
        >
          {importing ? "Importing..." : "Import"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Button sx={{textTransform: 'capitalize'}} variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Tambah User
        </Button>
      </Box>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Divider />
        <Box height={10} />
        <Stack direction="row" spacing={2} className="my-2 mb-2" alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, mb: 1 }}>
            <Typography variant="body2">Show</Typography>
            <TextField
              select
              size="small"
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              SelectProps={{ native: true }}
              sx={{ width: 64, ml: 1 }}
            >
              {[10, 25, 100].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </TextField>
            <Typography variant="body2" sx={{ ml: 1 }}>Entries</Typography>

            <Typography variant="body1" sx={{ ml: 73 }}>Search:</Typography>
            <Autocomplete
              disablePortal
              id="user-search"
              options={allRows}
              sx={{ width: 187, ml: 2 }}
              onChange={(e, v) => filterData(v)}
              getOptionLabel={(row) => row.name || ""}
              renderInput={(params) => (
                <TextField {...params} size="small" />
              )}
            />
          </Box>
        </Stack>
        <Box height={10} />
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="user table">
            <TableHead>
              <TableRow>
                <TableCell align="left">No</TableCell>
                <TableCell align="left">Name</TableCell>
                <TableCell align="left">Email</TableCell>
                <TableCell align="left">NIP</TableCell>
                <TableCell align="left">Position</TableCell>
                <TableCell align="left">Initial</TableCell>
                <TableCell align="left">Role</TableCell>
                {/* <TableCell align="left">Study Program ID</TableCell> */}
                <TableCell align="left">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow hover key={row.id}>
                  <TableCell align="left" >{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell align="left">{row.name}</TableCell>
                  <TableCell align="left">{row.email}</TableCell>
                  <TableCell align="left">{row.nip}</TableCell>
                  <TableCell align="left">{row.position}</TableCell>
                  <TableCell align="left">{row.initial}</TableCell>
                  <TableCell align="left">{row.role}</TableCell>
                  {/* <TableCell align="left">{row.study_program_id}</TableCell> */}
                  <TableCell align="left">
                    <Stack direction="row" spacing={2}>
                      <EditIcon sx={{ color: "blue", cursor: "pointer" }} onClick={() => editData(row)} />
                      <DeleteIcon sx={{ color: "darkred", cursor: "pointer" }} onClick={() => deleteUser(row.id)} />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage=""
          sx={{
            "& .MuiTablePagination-selectLabel": { display: "none" },
            "& .MuiTablePagination-input": { display: "none" },
          }}
        />
      </Paper>
    </>
  );
}
