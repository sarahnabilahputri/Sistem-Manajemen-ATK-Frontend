import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Swal from 'sweetalert2';
import AddTerima from './AddTerima';
import EditTerima from './EditTerima';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  borderRadius: '12px',
  boxShadow: 24,
  border: 'none',
  p: 4,
};

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function TerimaList() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoOptions, setAutoOptions] = useState([]);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditOpen = () => setEditOpen(true);
  const handleEditClose = () => setEditOpen(false);

  // Fetch received products
const fetchReceived = (pageArg = 1, limitArg = rowsPerPage, search = '') => {
  axios.get(`${API_BASE_URL}/api/product-received`, {
    params: { page: pageArg, limit: limitArg, search },
    headers: { 'Accept': 'application/json' }
  })
  .then(response => {
    console.log("API Response:", response.data);
    const data = response?.data?.data;
    const items = data?.data || [];

    const formatted = items.sort((a, b) =>
      new Date(b.received_date) - new Date(a.received_date)
    ).map(item => ({
      id: item.id,
      reorderId: item.reorder_id,
      date: item.received_date,
      status: item.received_status,
      totalPrice: item.total_received_price
    }));

    setRows(formatted);
    setAllRows(formatted);
    setTotalItems(data?.total || 0); // <-- ini baris yang penting!
  })
  .catch(err => {
    console.error('Error fetching received data:', err);
    setError(err);
  });
};


  useEffect(() => {
    fetchReceived(1, rowsPerPage, searchTerm);
  }, [rowsPerPage, searchTerm]);

  // Autocomplete suggestions
  useEffect(() => {
    let active = true;
    if (!searchTerm) {
      setAutoOptions([]);
      return undefined;
    }
    (async () => {
      try {
        const resp = await axios.get(`${API_BASE_URL}/api/product-received`, {
          params: { page: 1, limit: rowsPerPage, search: searchTerm },
          headers: { 'Accept': 'application/json' }
        });
        if (!active) return;
        const opts = resp.data.data.data.map(item => item.reorder_id);
        setAutoOptions(opts);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    })();
    return () => { active = false; };
  }, [searchTerm, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchReceived(newPage + 1, rowsPerPage, searchTerm);
  };

  const handleChangeRowsPerPage = event => {
    const newLimit = +event.target.value;
    setRowsPerPage(newLimit);
    setPage(0);
    fetchReceived(1, newLimit, searchTerm);
  };

  const handleDelete = id => {
    Swal.fire({
      title: 'Hapus penerimaan?',
      text: 'Yakin ingin menghapus data ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal'
    }).then(result => {
      if (result.isConfirmed) {
        axios.delete(`${API_BASE_URL}/api/product-received/${id}`)
          .then(() => {
            Swal.fire('Dihapus!', 'Data berhasil dihapus.', 'success');
            fetchReceived(page + 1, rowsPerPage, searchTerm);
          })
          .catch(err => console.error(err));
      }
    });
  };

  const handleEdit = row => {
    setFormData(row);
    handleEditOpen();
  };

  if (error) return <div>Error: {error.message}</div>;

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}><AddTerima CloseEvent={handleClose} onSuccess={() => fetchReceived(1, rowsPerPage, searchTerm)} /></Box>
      </Modal>
      <Modal open={editOpen} onClose={handleEditClose}>
        <Box sx={style}><EditTerima CloseEvent={handleEditClose} formData={formData} onSuccess={() => fetchReceived(page+1, rowsPerPage, searchTerm)} /></Box>
      </Modal>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mr: 2.5 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ textTransform: 'capitalize' }}>
          Terima Barang
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Divider />
        <Box height={10} />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 2, mb: 2 }}>
          <Typography variant="body2">Show</Typography>
          <TextField
            select size="small" value={rowsPerPage} onChange={handleChangeRowsPerPage}
            SelectProps={{ native: true }} sx={{ width: 64, ml: 1 }}>
            {[10,25,100].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </TextField>
          <Typography variant="body2" sx={{ ml: 1 }}>Entries</Typography>

          <Typography variant="body1" sx={{ ml: 'auto' }}>Search:</Typography>
          <Autocomplete
            freeSolo inputValue={searchTerm} onInputChange={(_,v) => { setSearchTerm(v); setPage(0); }}
            options={autoOptions} filterOptions={opts => opts}
            onChange={(_, val) => { if(val){ setSearchTerm(val); setPage(0); }} }
            renderInput={params => <TextField {...params} size="small" sx={{ width:187, ml:2 }} />}
          />
        </Stack>

        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Reorder ID</TableCell>
                <TableCell>Tanggal Diterima</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total Harga</TableCell>
                <TableCell align="right">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow hover key={row.id}>
                  <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>{row.reorderId}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell align="right">{row.totalPrice}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <EditIcon sx={{ cursor:'pointer', color:'blue' }} onClick={() => handleEdit(row)} />
                      <DeleteIcon sx={{ cursor:'pointer', color:'darkred' }} onClick={() => handleDelete(row.id)} />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10,25,100]}
          component="div" count={totalItems}
          rowsPerPage={rowsPerPage} page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage=""
          sx={{ '& .MuiTablePagination-selectLabel':{display:'none'}, '& .MuiTablePagination-input':{display:'none'} }}
        />
      </Paper>
    </>
  );
}
