import * as React from 'react';
import { useState, useEffect } from 'react';
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
import AddBaak from './AddBAAK';
import EditBaak from './EditBAAK';

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

export default function BAAKList() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [formid, setFormid] = useState("");
  const [editopen, setEditOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoOptions, setAutoOptions] = useState([]);

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const role = user?.role;

  const handleOpen = () => setOpen(true);
  const handleEditOpen = () => setEditOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditClose = () => setEditOpen(false);

  const fetchUsers = (pageArg = 1, limitArg = rowsPerPage, search = "") => {
    axios.get(`${API_BASE_URL}/api/users`, {
      params: { page: pageArg, limit: limitArg, search },
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      }
    })
    .then((response) => {
      const data = response.data.data;
      const items = data.data
        .filter((user) => user.role === 'BAAK')
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

  useEffect(() => {
    fetchUsers(1, rowsPerPage, searchTerm);
  }, [searchTerm, rowsPerPage]);

  useEffect(() => {
    let active = true;
    if (searchTerm === "") {
      setAutoOptions([]);
      return undefined;
    }

    (async () => {
      try {
        const resp = await axios.get(`${API_BASE_URL}/api/users`, {
          params: { page: 1, limit: rowsPerPage, search: searchTerm },
          headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        if (!active) return;
        const opts = resp.data.data.data
          .filter(user => user.role === 'BAAK')
          .map(user => user.name);
        setAutoOptions(opts);
      } catch (err) {
        console.error("Error fetching suggestions", err);
      }
    })();

    return () => {
      active = false;
    };
  }, [searchTerm, rowsPerPage]);

  const deleteUser = (id) => {
    Swal.fire({
      title: "Hapus item?",
      text: "Yakin ingin menghapus item ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya",
      cancelButtonText: 'Batal',
    }).then((result) => {
      if (result.value) {
        deleteApi(id);
      }
    });
  };

  const deleteApi = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`);
      Swal.fire("Berhasil!","User BAAK Berhasil Dihapus", "success");
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
    fetchUsers(newPage + 1, rowsPerPage, searchTerm);
  };

  const handleChangeRowsPerPage = (event) => {
    const newLimit = +event.target.value;
    setRowsPerPage(newLimit);
    setPage(0);
    fetchUsers(1, newLimit, searchTerm);
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
            <AddBaak CloseEvent={handleClose} onSuccess={fetchUsers} />
          </Box>
        </Modal>
        <Modal open={editopen} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
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
            }}>
            <EditBaak CloseEvent={handleEditClose} fid={formid} onSuccess={fetchUsers} />
          </Box>
        </Modal>
      </div>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, mr: 2.5, ...(role === "Kabag" && { mb: 6 }) }}>
        {role !== "Kabag" && (
        <Button sx={{textTransform: 'capitalize'}} variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Tambah User
        </Button>
        )}
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
              freeSolo
              inputValue={searchTerm}
              onInputChange={(_, v) => {
                setSearchTerm(v);    
                setPage(0);
              }}
              options={autoOptions}             
              filterOptions={(opts) => opts}     
              onChange={(_, selectedName) => {
                
                if (selectedName) {
                  setSearchTerm(selectedName);
                  setPage(0);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  sx={{ width: 187, ml: 2 }}
                />
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
                {role !== "Kabag" && (
                <TableCell align="left" sx={{ width: 10 }}>Aksi</TableCell>
                )}
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
                  {role !== "Kabag" && (
                  <TableCell align="left">
                    <Stack direction="row" spacing={2}>
                      <EditIcon sx={{ color: "blue", cursor: "pointer" }} onClick={() => editData(row)} />
                      <DeleteIcon sx={{ color: "darkred", cursor: "pointer" }} onClick={() => deleteUser(row.id)} />
                    </Stack>
                  </TableCell>
                  )}
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
