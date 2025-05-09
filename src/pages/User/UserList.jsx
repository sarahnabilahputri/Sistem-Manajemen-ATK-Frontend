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
import AddUser from './AddUser';
// import EditUser from './EditUser';

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

export default function UserList() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [formid, setFormid] = useState("");
  const [editopen, setEditOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleEditOpen = () => setEditOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditClose = () => setEditOpen(false);

  const fetchUsers = () => {
    axios.get('https://80ea-125-165-106-71.ngrok-free.app/api/users', {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      }
    })
    .then((response) => {
      const usersArray = response.data.data.data || [];
      const sortedUser = usersArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const formattedRows = usersArray.map((user) => ({
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
    })
    .catch((error) => {
      console.error('Error fetching users:', error);
      setError(error);
    });
  };

  useEffect(() => {
    fetchUsers();
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
      await axios.delete(`https://80ea-125-165-106-71.ngrok-free.app/api/users/${id}`);
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

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
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
            <AddUser CloseEvent={handleClose} onSuccess={fetchUsers} />
          </Box>
        </Modal>
        <Modal open={editopen} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
          <Box sx={style}>
            {/* <EditUser CloseEvent={handleEditClose} userData={formid} onSuccess={fetchUsers} /> */}
          </Box>
        </Modal>
      </div>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, mr: 2.5 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
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
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
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
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
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
