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

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function KategoriList() {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [autoOptions, setAutoOptions] = useState([]);

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const role = user?.role;

  const handleOpen = () => setOpen(true);
  const handleEditOpen = () => setEditOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditClose = () => setEditOpen(false);

  const fetchCategories = (pageArg = 1, limitArg = rowsPerPage, search = "") => {
    axios.get(`${API_BASE_URL}/api/categories`, {
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
      const formattedRows = items.map(category => ({
        id: category.id,
        IdKategori: category.id,
        Kategori: category.name
      }));
      setRows(formattedRows);
      setAllRows(formattedRows);
      setTotalItems(data.total); 
    })
    .catch((error) => {
      console.error('Error fetching categories:', error);
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
        `${API_BASE_URL}/api/categories/import`,
        formData,
        {
         headers: {
            "Content-Type": "multipart/form-data",
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );
      Swal.fire("Success", "Import kategori berhasil", "success");
      fetchCategories();                             
      } catch (err) {
      const errorData = err.response?.data;
  
      let msg = errorData?.message || "Gagal import kategori";

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
    fetchCategories(1, rowsPerPage, searchTerm);
  }, [searchTerm, rowsPerPage]);

  useEffect(() => {
    let active = true;
    if (searchTerm === "") {
      setAutoOptions([]);
      return undefined;
    }

    (async () => {
      try {
        const resp = await axios.get(`${API_BASE_URL}/api/categories`, {
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
      await axios.delete(`${API_BASE_URL}/api/categories/${id}`);
      Swal.fire("Berhasil!","Kategori Berhasil Dihapus", "success");
      setRows(rows.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const editData = (id, IdKategori, Kategori) => {
    setFormid({ id, IdKategori, Kategori });
    handleEditOpen();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchCategories(newPage + 1, rowsPerPage, searchTerm);
  };

  const handleChangeRowsPerPage = (event) => {
    const newLimit = +event.target.value;
    setRowsPerPage(newLimit);
    setPage(0);
    fetchCategories(1, newLimit, searchTerm);
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
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, mr: 2.5, ...(role === "Kabag" && { mb: 6 }) }}>
        {role !== "Kabag" && (
        <Button
          variant="contained"
          onClick={handleClickImport}
          disabled={importing}
          startIcon={
            <Box
              component="img"
              src="/Icon/import.png"      
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
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        {role !== "Kabag" && (
        <Button sx={{textTransform: 'capitalize'}} variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Tambah Kategori
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
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell align="left" sx={{ width: '10%' }}>No</TableCell>
                <TableCell align="center" sx={{ width: '10%' }}>Kategori</TableCell>
                {role !== "Kabag" && (
                  <TableCell align="right" sx={{ width: '10%' }}>Aksi</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow hover key={row.id}>
                  <TableCell align="left" >{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell align="center">{row.Kategori}</TableCell>
                  {role !== "Kabag" && (
                  <TableCell align="right">
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <EditIcon sx={{ color: "blue", cursor: "pointer" }} onClick={() => editData(row.id, row.IdKategori, row.Kategori)} />
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
