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
import AddProdi from './AddProdi';
import EditProdi from './EditProdi';

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

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function ProdiList() {
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

  const fetchProdi = (pageArg = 1, limitArg = rowsPerPage, search = "") => {
    axios.get( `${API_BASE_URL}/api/study-programs`, {
      params: { page: pageArg, limit: limitArg, search },
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      }
    })
    .then((response) => {
      const data = response.data.data;
      const items = data.data.sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      ); 
      const formattedRows = items.map(prodi => ({
        id: prodi.id,
        IdProdi: prodi.id,
        Prodi: prodi.name
      }));
      setRows(formattedRows);
      setAllRows(formattedRows);
      setTotalItems(data.total);
    })
    .catch((error) => {
      console.error('Error fetching prodi:', error);
      setError(error);
    });
  };

  useEffect(() => {
    fetchProdi(1, rowsPerPage, searchTerm);
  }, [searchTerm, rowsPerPage]);

  useEffect(() => {
    let active = true;
    if (searchTerm === "") {
      setAutoOptions([]);
      return undefined;
    }

    (async () => {
      try {
        const resp = await axios.get(`${API_BASE_URL}/api/study-programs`, {
          params: { page: 1, limit: rowsPerPage, search: searchTerm },
          headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        if (!active) return;
        const opts = resp.data.data.data.map(p => p.name);
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
      await axios.delete(`${API_BASE_URL}/api/study-programs/${id}`);
      Swal.fire("Berhasil!","Prodi Berhasil Dihapus", "success");
      setRows(rows.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Error deleting prodi:", error);
    }
  };

  const editData = (id, IdProdi, Prodi) => {
    setFormid({ id, IdProdi, Prodi });
    handleEditOpen();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchProdi(newPage + 1, rowsPerPage, searchTerm);
  };

  const handleChangeRowsPerPage = (event) => {
    const newLimit = +event.target.value;
    setRowsPerPage(newLimit);
    setPage(0);
    fetchProdi(1, newLimit, searchTerm);
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
            <AddProdi CloseEvent={handleClose} onSuccess={fetchProdi}/>
          </Box>
        </Modal>
        <Modal open={editopen} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
          <Box sx={style}>
            <EditProdi CloseEvent={handleEditClose} fid={formid} onSuccess={fetchProdi}/>
          </Box>
        </Modal>
      </div>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, mr: 2.5, ...(role === "Kabag" && { mb: 6 }) }}>
        {role !== "Kabag" && (
        <Button sx={{textTransform: 'capitalize'}} variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Tambah Program Studi
        </Button>
        )}
      </Box>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Divider />
        <Box height={10} />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: '100%', py: 1, px: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Show</Typography>
            <TextField
              select
              size="small"
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              SelectProps={{ native: true }}
              sx={{ width: { xs: 60, sm: 73 } }}
            >
              {[10, 25, 100].map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </TextField>
            <Typography variant="body2">Entries</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Search:</Typography>
            <Autocomplete
              freeSolo
              inputValue={searchTerm}
              onInputChange={(_, v) => {
                setSearchTerm(v);
                setPage(0);
              }}
              options={autoOptions}
              filterOptions={opts => opts}
              onChange={(_, selected) => {
                if (selected) {
                  setSearchTerm(selected);
                  setPage(0);
                }
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  size="small"
                  sx={{
                    width: {
                      xs: 120,   
                      sm: 160,   
                      md: 200    
                    }
                  }}
                />
              )}
            />
          </Box>
        </Stack>
        <Box height={10} />
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell align="left" sx={{ width: '10%' }}>No</TableCell>
                <TableCell align="center" sx={{ width: '10%' }}>Prodi</TableCell>
                {role !== "Kabag" && (
                <TableCell align="right" sx={{ width: '10%' }}>Aksi</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow hover key={row.id}>
                  <TableCell align="left" >{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell align="center">{row.Prodi}</TableCell>
                  {role !== "Kabag" && (
                  <TableCell align="right">
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <EditIcon sx={{ color: "blue", cursor: "pointer" }} onClick={() => editData(row.id, row.IdProdi, row.Prodi)} />
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
