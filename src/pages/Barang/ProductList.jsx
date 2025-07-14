import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from '../Api';
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
import { useCart } from '../../context/CartContext';

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
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [formid, setFormid] = useState("");
  const [editopen, setEditOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const { items: cartItems, addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [autoOptions, setAutoOptions] = useState([]);

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const role = user?.role;

  const handleAddToCart = async (row) => {
    try {
      await addToCart({ id: row.id });
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: `${row.NamaProduk} berhasil ditambahkan ke keranjang`,
        confirmButtonText: 'OK'
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menambah ke keranjang';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonText: 'OK'
      });
    }
  };

  const handleOpen = () => setOpen(true);
  const handleEditOpen = () => setEditOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditClose = () => setEditOpen(false);

  const fetchProducts = (pageArg = 1, limitArg = rowsPerPage, search = "") => {
    axios.get(`${API_BASE_URL}/api/products`, {
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
      const formattedRows = items.map(product => ({
        id: product.id,
        NamaProduk: product.name,
        Kategori: product.category ? product.category.name : "-",
        Stock: product.stock,
        ReorderPoint: product.reorder_point,
        SafetyStock: product.safety_stock,
        EOQ: product.economic_order_quantity,
        _raw: product,
      }));
      const sortedRows = formattedRows.sort((a, b) => {
        const da = Math.abs(a.Stock - a.ReorderPoint);
        const db = Math.abs(b.Stock - b.ReorderPoint);
        return da - db;
      });
      setRows(sortedRows);
      setAllRows(sortedRows);
      setTotalItems(data.total); 
    })
    .catch((error) => {
      console.error('Error fetching products:', error);
      setError(error);
    });
  };

  useEffect(() => {
    fetchProducts(1, rowsPerPage, searchTerm);
  }, [searchTerm, rowsPerPage]);

  useEffect(() => {
    let active = true;
    if (searchTerm === "") {
      setAutoOptions([]);
      return undefined;
    }

    (async () => {
      try {
        const resp = await axios.get(`${API_BASE_URL}/api/products`, {
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


  const fetchFirstPageCombined = async () => {
    try {
      const resp1 = await axios.get(
        `${API_BASE_URL}/api/products?page=1&limit=${rowsPerPage}`, 
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json'
          }
        }
      );
      const resp2 = await axios.get(
        `${API_BASE_URL}/api/products?page=2&limit=${rowsPerPage}`, 
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json'
          }
        }
      );

      const arr1 = resp1.data.data.data; 
      const arr2 = resp2.data.data.data;

      const combined = [...arr1, ...arr2];

      combined.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        return b.id - a.id;
      });

      const sliced = combined.slice(0, rowsPerPage);

      const formattedRows = sliced.map(product => ({
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

      setTotalItems(resp1.data.data.total);

    } catch (err) {
      console.error("Error fetchFirstPageCombined:", err);
      setError(err);
    }
  };

  const handleClickImport = () => {
    Swal.fire({
      title: 'Download template?',
      text: 'Apakah Anda ingin mendownload template import barang terlebih dahulu?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, download',
      cancelButtonText: 'Tidak, pilih file'
    }).then(result => {
      if (!result.isConfirmed) {
        fileInputRef.current.click();
        return;
      }

      fetch(`${API_BASE_URL}/api/product-template`, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        console.log('Downloaded blob type:', blob.type);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product-template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Download gagal:', err);
        Swal.fire('Error', 'Gagal mendownload template.', 'error');
      });
    });
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
        `${API_BASE_URL}/api/products/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );

      Swal.fire("Success", "Import product berhasil", "success");
      setPage(0);
      fetchFirstPageCombined();
    } catch (err) {
      console.log(">>> err.response.data:", err.response?.data);
      const errorData = err.response?.data;
      let msg = errorData?.message || "Gagal import product";

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
          color: #666;
          font-size: 0.85rem;
          white-space: pre-line;
        ">${msg}</div>`,
      });
    } finally {
      setImporting(false);
      e.target.value = null; 
    }
  };

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
      await axios.delete(`${API_BASE_URL}/api/products/${id}`);
      Swal.fire("Berhasil!","Produk Berhasil Dihapus", "success");
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
    fetchProducts(newPage + 1, rowsPerPage, searchTerm);
  };

  const handleChangeRowsPerPage = (event) => {
    const newLimit = +event.target.value;
    setRowsPerPage(newLimit);
    setPage(0);
    fetchProducts(1, newLimit, searchTerm);
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
            <AddProduct
              CloseEvent={handleClose}
              onSuccess={() => {
                setPage(0);
                fetchProducts(1, rowsPerPage, searchTerm);
              }}
            />
          </Box>
        </Modal>
        <Modal open={editopen}>
          <Box sx={style}>
            <EditProduct CloseEvent={handleEditClose} fid={formid} onSuccess={fetchProducts}/>
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
            Tambah Produk
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
                <TableCell>No</TableCell>
                <TableCell>Nama Produk</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Reorder Point</TableCell>
                <TableCell>Safety Stock</TableCell>
                <TableCell>EOQ</TableCell>
                {role !== "Kabag" && (               
                  <TableCell align="left" sx={{ width: 10 }}>Aksi</TableCell>
                )}
                </TableRow>
            </TableHead>
            <TableBody>
            {rows.map((row, index) => {
              const inCart = cartItems.some(item => item.product.id === row.id);
              return (               
                <TableRow
                  key={row.id}
                  sx={{
                    backgroundColor: row.Stock <= row.ReorderPoint ? "#FFE0E9" : "inherit",
                    ...(row.Stock <= row.ReorderPoint && {
                      "& .MuiTableCell-root": {
                        borderTop: "1px solid #FF0000",
                        borderBottom: "1px solid #FF0000",
                      },
                      "& .MuiTableCell-root:first-of-type": {
                        borderLeft: "1px solid #FF0000",
                      },
                      "& .MuiTableCell-root:last-of-type": {
                        borderRight: "1px solid #FF0000",
                      },
                    })
                  }}
                >
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{row.NamaProduk}</TableCell>
                  <TableCell>{row.Kategori}</TableCell>
                  <TableCell>{row.Stock}</TableCell>
                  <TableCell>{Math.floor(row.ReorderPoint)}</TableCell>
                  <TableCell>{Math.floor(row.SafetyStock)}</TableCell>
                  <TableCell>{Math.floor(row.EOQ)}</TableCell>
                  {role !== "Kabag" && (
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <EditIcon sx={{ color: "blue", cursor: "pointer" }} onClick={() => editData(row.id, row.NamaProduk, row.Kategori, row.Stock, row.ReorderPoint, row.SafetyStock, row.EOQ)} />
                      <DeleteIcon sx={{ color: "darkred", cursor: "pointer" }} onClick={() => deleteUser(row.id)} />
                      {inCart ? (
                        <Button variant="outlined" size="small" disabled>
                          Pesan
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleAddToCart(row)}
                          color={row.Stock <= row.ReorderPoint ? "error" : "primary"}
                        >
                          Pesan
                        </Button>
                      )}
                    </Stack>                    
                  </TableCell>
                  )}
                </TableRow>
              );  
            })}
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
