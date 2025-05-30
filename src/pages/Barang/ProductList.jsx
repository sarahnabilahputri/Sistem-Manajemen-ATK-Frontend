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
import AddProduct from "./AddProduct";
import EditProduct from './EditProduct';

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

export default function ProductList() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [formid, setFormid] = useState("");
  const [editopen, setEditOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const handleOpen = () => setOpen(true);
  const handleEditOpen = () => setEditOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditClose = () => setEditOpen(false);

  const fetchProducts = (pageArg = 1, limitArg = rowsPerPage) => {
      axios.get(`${API_BASE_URL}/api/products?page=${pageArg}&limit=${limitArg}`, {
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
      const formattedRows = items.map(product => ({
        id: product.id,
        NamaProduk: product.name,
        Kategori: product.category ? product.category.name : "-",
        Stock: product.stock,
        ReorderPoint: product.reorder_point,
        SafetyStock: product.safety_stock,
        EOQ: product.economic_order_quantity
      }));
      setRows(formattedRows);
      setAllRows(formattedRows);
      setTotalItems(data.total); 
    })
    .catch((error) => {
      console.error('Error fetching products:', error);
      setError(error);
    });
  };

  useEffect(() => {
    fetchProducts(1, rowsPerPage);
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
      await axios.delete(`${API_BASE_URL}/api/products/${id}`);
      Swal.fire("Deleted!", "Your product has been deleted.", "success");
      setRows(rows.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const editData = (id, name, category_id, stock, price, unit) => {
    setFormid({ id, name, category_id, stock, price, unit });
    handleEditOpen();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchProducts(newPage + 1, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newLimit = +event.target.value;
    setRowsPerPage(newLimit);
    setPage(0);
    fetchProducts(1, newLimit);
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
        <Modal open={open}>
          <Box sx={style}>
            <AddProduct CloseEvent={handleClose} onSuccess={fetchProducts}/>
          </Box>
        </Modal>
        <Modal open={editopen}>
          <Box sx={style}>
            <EditProduct CloseEvent={handleEditClose} fid={formid} onSuccess={fetchProducts}/>
          </Box>
        </Modal>
      </div>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, mr: 2.5 }}>
        <Button sx={{textTransform: 'capitalize'}} variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Tambah Produk
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
            getOptionLabel={(option) => option.NamaProduk || ""}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.NamaProduk}
              </li>
            )}
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
                <TableCell>No</TableCell>
                <TableCell>Nama Produk</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Reorder Point</TableCell>
                <TableCell>Safety Stock</TableCell>
                <TableCell>EOQ</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {rows.map((row, index) => (
                <TableRow hover key={row.id}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{row.NamaProduk}</TableCell>
                  <TableCell>{row.Kategori}</TableCell>
                  <TableCell>{row.Stock}</TableCell>
                  <TableCell>{Math.floor(row.ReorderPoint)}</TableCell>
                  <TableCell>{Math.floor(row.SafetyStock)}</TableCell>
                  <TableCell>{Math.floor(row.EOQ)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2}>
                      <EditIcon sx={{ color: "blue", cursor: "pointer" }} onClick={() => editData(row.id, row.NamaProduk, row.Kategori, row.Stock, row.ReorderPoint, row.SafetyStock, row.EOQ)} />
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
