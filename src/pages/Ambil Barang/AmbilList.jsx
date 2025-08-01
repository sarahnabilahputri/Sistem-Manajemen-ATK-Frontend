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
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Modal from '@mui/material/Modal';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Swal from 'sweetalert2';
import EditAmbil from './EditAmbil';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const backendBase = API_BASE_URL.replace(/\/$/, '');

export default function AmbilList() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  // const [allRows, setAllRows] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [users, setUsers] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [error, setError] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoOptions, setAutoOptions] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportRange, setExportRange] = useState({
    startDate: '', 
    endDate: ''     
  });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);


  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const role = user?.role;

  const openEdit = row => { setEditData(row); setEditOpen(true); };
  const closeEdit = () => setEditOpen(false);
  const handleSave = updated => {
    setRows(rows.map(r => r.id === updated.id ? updated : r));
    closeEdit();
  };
  const handleAdd = newItem => {
    setRows(prev => [newItem, ...prev]);
    // setAllRows(prev => [newItem, ...prev]);
    setTotalItems(prev => prev + 1);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.origin !== window.location.origin) return;
      const { type, data } = e.data || {};
      if (type === 'NEW_CHECKOUT') {
        setRows(prev => [data, ...prev]);
        // setAllRows(prev => [data, ...prev]);
        setTotalItems(prev => prev + 1);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);


  useEffect(() => {
    const onNew = e => handleAdd(e.detail);
    window.addEventListener('newCheckout', onNew);
    return () => window.removeEventListener('newCheckout', onNew);
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/users?page=1&limit=1000`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then(res => setUsers(res.data.data.data))
      .catch(console.error);
    axios.get(`${API_BASE_URL}/api/purposes?page=1&limit=1000`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then(res => setPurposes(res.data.data.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
  // tunggu users & purposes sudah ter-load
  if (!users.length || !purposes.length) return;

  const pageIndex = page + 1;  // karena backend mulai dari halaman 1
  axios.get(
    `${API_BASE_URL}/api/checkouts`,
    {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      params: { page: pageIndex, limit: rowsPerPage }
    }
  )
  .then(res => {
    // sesuai Postman: res.data.data → { current_page, data: [...] }
    const payload = res.data.data;
    const items = Array.isArray(payload.data) ? payload.data : [];

    // format setiap checkout
    const formatted = items.map(co => ({
      id: co.id,
      initial: users.find(u => u.id === co.user_id)?.initial || co.user_id,
      name:    users.find(u => u.id === co.user_id)?.name    || '—',
      date:    co.checkout_date,
      purpose: purposes.find(p => p.id === co.purpose_id)?.name || co.purpose_id,
      description: co.description,
      items: co.items.map(it => ({
        id: it.id,
        product: it.product,
        qty: it.checkout_quantity
      }))
    }));

    // sort terbaru → terlama
    formatted.sort((a, b) => new Date(b.date) - new Date(a.date));

    // set state
    setRows(formatted);
    setTotalItems(payload.total ?? items.length);  
    // jika backend kirim total di payload.total, pakai itu; 
    // kalau tidak, fallback ke items.length
  })
  .catch(err => {
    console.error('Error fetching checkouts:', err);
    setError(err);
  });
}, [users, purposes, page, rowsPerPage]);



  if (error) return <div>Error: {error.message}</div>;

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = e => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };
  // const handleSearch = (_, initial) => {
  //   if (initial) {
  //     setRows(allRows.filter(r => r.initial === initial));
  //   } else {
  //     setRows(allRows);
  //   }
  // };
  const handleSearch = (_, initial) => {
    setPage(0);
    if (initial) {
      setRows(prev => prev.filter(r => r.initial === initial));
    } else {
      setPage(0);
    }
  };  
  const openDetail = row => { setDetailData(row); setDetailOpen(true); };
  const closeDetail = () => setDetailOpen(false);
  // const uniqueInitials = Array.from(new Set(allRows.map(r => r.initial)));

  const deleteItem = (id) => {
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
      if (result.isConfirmed) {
        callDeleteApi(id);
      }
    });
  };

  const callDeleteApi = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/checkouts/${id}`);
      Swal.fire("Berhasil!","Data Berhasil Dihapus", "success");
      setRows(rows.filter(row => row.id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
      Swal.fire('Error', 'Gagal menghapus item.', 'error');
    }
  };

  const handleClickImport = () => {
  fileInputRef.current.click();
};

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);

    try {
      const response = await axios.post("/api/checkouts/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        toast.success("Import berhasil!");
        // Panggil ulang fetch data checkout jika ada
        fetchCheckoutData(); 
      }
    } catch (error) {
      console.error("Gagal import:", error);
      toast.error("Terjadi kesalahan saat mengimpor data");
    } finally {
      setImporting(false);
    }
  };

  const openExport = () => setExportOpen(true);
  const closeExport = () => setExportOpen(false);

  const handleExport = async () => {
    const { startDate, endDate } = exportRange;
    if (!startDate || !endDate) {
      closeExport();
      Swal.fire('Oops', 'Rentang tanggal wajib diisi.', 'warning');
      return;
    }
    setExporting(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/checkouts/export`,
        {
          params: { start_date: startDate, end_date: endDate },
          responseType: 'blob',   
          headers: { 'ngrok-skip-browser-warning': 'true' }
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = res.headers['content-disposition'];
      const filename = disposition
        ? disposition.split('filename=')[1]
        : `export_${startDate}_${endDate}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      closeExport();
      console.error(err);
      Swal.fire('Error', 'Gagal mengekspor data.', 'error');
    } finally {
      setExporting(false);
      closeExport();
    }
  };

  const uniqueInitials = React.useMemo(
    () => Array.from(new Set(rows.map(r => r.initial))),
    [rows]
  );

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mr: 2.5, ...(role === "Kabag" && { mb: 6 }) }}>
        {role !== "Kabag" && (
        <>
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

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <Button
            variant="contained"
            onClick={openExport}
            disabled={exporting}
            startIcon={
              <Box
                component="img"
                src="/Icon/export.png"
                alt="Export"
                sx={{ width: 15, height: 15 }}
              />
            }
            sx={{
              mr: 1,
              bgcolor: "#068f6b",
              color: "white",
              textTransform: 'capitalize',
              "&:hover": { bgcolor: "#056b51" },
            }}
          >
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </>
        )}

        {role !== "Kabag" && (  
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => window.open('http://localhost:5173/checkout', '_blank')}
          sx={{ textTransform: 'capitalize' }}
        >
          Tambah Pengambilan
        </Button>
        )}
      </Box>

      <Modal
        open={exportOpen}
        onClose={closeExport}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.5)',
          p: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: 500,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* HEADER */}
          <Box sx={{ p: 2, ml:1 }}>
            <Typography variant="h7" fontWeight="bold" >Export Data Pengambilan Barang</Typography>
          </Box>
          <Divider />

          {/* BODY */}
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Rentang Waktu
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Start date */}
              <TextField
                type="date"
                size="small"
                value={exportRange.startDate}
                onChange={e =>
                  setExportRange(prev => ({ ...prev, startDate: e.target.value }))
                }
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
              />

              {/* Label 's.d.' */}
              <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                s.d.
              </Typography>

              {/* End date */}
              <TextField
                type="date"
                size="small"
                value={exportRange.endDate}
                onChange={e =>
                  setExportRange(prev => ({ ...prev, endDate: e.target.value }))
                }
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
          <Divider />

          {/* FOOTER */}
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="contained"
              onClick={closeExport}
              sx={{
                mr: 1,
                bgcolor: "#E4E6EF",
                color: "black",
                textTransform: "capitalize",
                "&:hover": { bgcolor: "#d1d3db" }
              }}
            >
              Tutup
            </Button>
            <Button
              variant="contained"
              startIcon={<Box component="img" src="/Icon/export.png" sx={{ width:15, height:15 }} />}
              disabled={exporting}
              onClick={handleExport}
              sx={{
                bgcolor: "#009D70",
                color: "white",
                textTransform: "capitalize",
                "&:hover": { bgcolor: "#008a60" }
              }}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </Box>
        </Paper>
      </Modal>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Divider />
        <Box height={10} />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
          <Typography>Show</Typography>
          <TextField
            select size="small"
            value={rowsPerPage}
            onChange={handleChangeRowsPerPage}
            SelectProps={{ native: true }}
            sx={{ width: 64 }}
          >
            {[10,25,100].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </TextField>
          <Typography>Entries</Typography>
          <Box flexGrow={1} />
          <Typography>Search:</Typography>
           <Autocomplete
            disablePortal
            options={uniqueInitials}
            getOptionLabel={opt => opt}
            sx={{ width: 200, ml: 2 }}
            onChange={handleSearch}
            renderInput={params => <TextField {...params} size="small" />}
          />
        </Stack>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Inisial</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>Tanggal Butuh</TableCell>
                <TableCell>Kebutuhan</TableCell>
                <TableCell align="left" sx={{ width: 10 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow hover key={row.id}>
                  <TableCell>{page*rowsPerPage + idx + 1}</TableCell>
                  <TableCell>{row.initial}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    {new Date(row.date).toLocaleString('en-GB', {
                      timeZone: 'Asia/Jakarta',
                      hour12: false,
                      year:   'numeric',
                      month:  '2-digit',
                      day:    '2-digit',
                      // hour:   '2-digit',
                      // minute: '2-digit'
                    }).replace(',', '')}
                  </TableCell>
                  <TableCell>{row.purpose}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {role !== "Kabag" && (
                      <>
                      <IconButton sx={{ color: 'blue' }} onClick={() => openEdit(row)}><EditIcon/></IconButton>
                      <IconButton sx={{ color: 'darkred' }} onClick={() => deleteItem(row.id)}><DeleteIcon/></IconButton>
                      </>
                      )}
                      <IconButton sx={{ color: 'gray' }} onClick={() => openDetail(row)}><InfoIcon/></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10,25,100]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage=""
          sx={{ '& .MuiTablePagination-selectLabel':{display:'none'}, '& .MuiTablePagination-input':{display:'none'} }}
        />
      </Paper>

      <EditAmbil
        open={editOpen}
        onClose={closeEdit}
        data={editData}
        purposes={purposes}
        initialOptions={uniqueInitials}
        onSave={item => {
          handleSave(item); 
          closeEdit();
        }}      
        />

      {/* Detail Modal: mirror daftar keranjang layout */}
      <Modal
        open={detailOpen}
        onClose={closeDetail}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.5)', p: 2 }}
      >
        <Paper elevation={3} sx={{ width: 450, height: '80vh', display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={closeDetail}><ArrowBackIosNewIcon/></IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', mr: 1 }}>Detail Pengambilan</Typography>
          </Box>
          {/* Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1, bgcolor: '#f5f5f5' }}>
            {detailData?.items.length ? detailData.items.map(item => {
              const rawImage = item.product.image || '';
              const cleaned  = rawImage.replace(/^\//,'');
              let imgSrc;
              if (/^https?:\/\//i.test(cleaned)) {
                imgSrc = cleaned;
              } else if (cleaned.startsWith('images/')) {
                imgSrc = `${backendBase}/storage/${cleaned}`;
              } else {
                imgSrc = `${backendBase}/${cleaned}`;
              }

              return (
              <Paper
                key={item.id}
                variant="outlined"
                sx={{ display: 'flex', alignItems: 'flex-start', p: 2, mb: 1 }}
              >
                <Box
                  component="img"
                  src={imgSrc}
                  alt={item.product.name}
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `${backendBase}/assets/images/default_product.jpg`;
                  }}
                  sx={{ width: 45, height: 45, ml: 0.5, mr: 2.5, objectFit: 'cover', borderRadius: 1 }}
                />  

                <Box
                  sx={{
                    flexGrow: 1,
                    display: 'grid',
                    gridTemplateColumns: '130px 1fr',  
                    columnGap: 2,
                    rowGap: 1,
                  }}
                >
                  <Typography variant="subtitle2">Nama Barang:</Typography>
                  <Typography variant="subtitle2">{item.product.name}</Typography>

                  <Typography variant="subtitle2">Jumlah dibutuhkan:</Typography>
                  <Typography variant="subtitle2">{item.qty}</Typography>

                  <Typography variant="subtitle2">Stok saat ini:</Typography>
                  <Typography variant="subtitle2">{item.product.stock}</Typography>
                </Box>
              </Paper>
              );
            }) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Tidak ada barang</Typography>
              </Box>
            )}
            {/* Detail fields read-only */}
            <Box sx={{ mt: 1, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#1976D2' }}>Tanggal Butuh</Typography>
              <Typography variant="subtitle2">
                {new Date(detailData?.date).toLocaleString('en-GB', {
                  timeZone: 'Asia/Jakarta',
                  hour12: false,
                  year:   'numeric',
                  month:  '2-digit',
                  day:    '2-digit',
                  // hour:   '2-digit',
                  // minute: '2-digit'
                }).replace(',', '')}              
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#1976D2' }}>Kebutuhan</Typography>
              <Typography variant="subtitle2">{detailData?.purpose}</Typography>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#1976D2' }}>Inisial</Typography>
              <Typography variant="subtitle2">{detailData?.initial}</Typography>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#1976D2' }}>Deskripsi</Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  whiteSpace: 'pre-wrap',    
                  wordBreak: 'break-word',    
                  overflowWrap: 'break-word', 
                  mt: 0,                      
                }}
              >
                {detailData?.description}
              </Typography>            
              </Box>
          </Box>
          {/* Footer */}
          <Box sx={{ p: 2, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={closeDetail}
            sx={{
              mr: 1,
              bgcolor: "#E4E6EF",
              color: "black",
              textTransform: "capitalize",
              "&:hover": { bgcolor: "#d1d3db" }
            }}
          >
            Tutup
          </Button>
          </Box>
        </Paper>
      </Modal>
    </>
  );
}
