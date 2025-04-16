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
import AddKategori from "./AddKategori";
import EditKategori from "./EditKategori";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: "12px",
  boxShadow: 24,
  border: "none",
  p: 4,
};

export default function KategoriList() {
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

  const fetchCategories = () => {
    axios.get('https://f389-125-165-106-98.ngrok-free.app/api/categories', {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      }
    })
    .then((response) => {
      const categoryArray = response.data.data.data || [];
      const formattedRows = categoryArray.map((category) => ({
        id: category.id,
        IdKategori: category.id,
        Kategori: category.name
      }));
      setRows(formattedRows);
      setAllRows(formattedRows);
    })
    .catch((error) => {
      console.error('Error fetching categories:', error);
      setError(error);
    });
  };

  useEffect(() => {
    fetchCategories();
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
      await axios.delete(`https://f389-125-165-106-98.ngrok-free.app/api/categories/${id}`);
      Swal.fire("Deleted!", "Your category has been deleted.", "success");
      setRows(rows.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const editData = (id, IdKategori, Kategori) => {
    setFormid({ id, IdKategori, Kategori });
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
        <Modal open={open} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
          <Box sx={style}>
            <AddKategori CloseEvent={handleClose} onSuccess={fetchCategories}/>
          </Box>
        </Modal>
        <Modal open={editopen} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
          <Box sx={style}>
            <EditKategori CloseEvent={handleEditClose} fid={formid} onSuccess={fetchCategories}/>
          </Box>
        </Modal>
      </div>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, mr: 2.5 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Tambah Kategori
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
            id="combo-box-demo"
            options={allRows}
            sx={{ width: 187, ml: 2 }}
            onChange={(e, v) => filterData(v)}
            getOptionLabel={(row) => row.Kategori || ""}
            renderInput={(params) => (
              <TextField {...params} size="small" />
            )}
          />
          </Box>
        </Stack>
        <Box height={10} />
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell align="left">Id Kategori</TableCell>
                <TableCell align="Left">Kategori</TableCell>
                <TableCell align="left">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell align="left">{row.IdKategori}</TableCell>
                  <TableCell align="Left">{row.Kategori}</TableCell>
                  <TableCell align="left">
                    <Stack direction="row" spacing={2}>
                      <EditIcon sx={{ color: "blue", cursor: "pointer" }} onClick={() => editData(row.id, row.IdKategori, row.Kategori)} />
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
