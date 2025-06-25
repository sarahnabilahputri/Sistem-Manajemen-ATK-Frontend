import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
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
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Modal from '@mui/material/Modal';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EditPesan from './EditPesan';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const backendBase = API_BASE_URL.replace(/\/$/, '');
const modalStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'rgba(0,0,0,0.5)',
  p: 2,
};
const panelStyle = {
  width: 400,
  borderRadius: 2,
  p: 3,
  bgcolor: 'background.paper',
  boxShadow: 24,
};

export default function PesanList() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoOptions, setAutoOptions] = useState([]);
  const [error, setError] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedOrderForSend, setSelectedOrderForSend] = useState(null);
  const [selectedUserForSend, setSelectedUserForSend] = useState(null);

  const navigate = useNavigate();
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(+e.target.value); setPage(0); };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2,'0');
    const month = String(d.getMonth()+1).padStart(2,'0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const parseDate = (dateStr) => dateStr ? new Date(dateStr) : new Date(0);

  const formatRp = (value) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const sortRows = arr => arr.slice().sort((a, b) => {
    const dateA = new Date(a.created_at || a.reorder_date);
    const dateB = new Date(b.created_at || b.reorder_date);
    return dateB.getTime() - dateA.getTime();
  });

  const openDetail = (row) => { setDetailData(row); setDetailOpen(true); };
  const closeDetail = () => setDetailOpen(false);
  const openEdit = (row) => { setEditData(row); setEditOpen(true); };
  const closeEdit = () => setEditOpen(false);
  const handleSaveEdit = (updated) => {
    if (!updated) return;
    const updatedAll = allRows.map(r => r.id === updated.id ? updated : r);
    const sortedAll = sortRows(updatedAll);
    setAllRows(sortedAll);
    const filtered = sortedAll.filter(r => !searchTerm || r.initial.toLowerCase().includes(searchTerm.toLowerCase()));
    setRows(filtered);
    setTotalItems(filtered.length);
    closeEdit();
  };

  const handleDeleteFromEdit = (id) => {
    const filteredAll = allRows.filter(r => r.id !== id);
    const sortedAll = sortRows(filteredAll);
    setAllRows(sortedAll);
    const filtered = sortedAll.filter(r => !searchTerm || r.initial.toLowerCase().includes(searchTerm.toLowerCase()));
    setRows(filtered);
    setTotalItems(filtered.length);
    closeEdit();
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/users?page=1&limit=1000`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then(res => {
        const arr = res.data.data?.data || res.data.data || [];
        setUsers(arr);
      })
      .catch(err => console.error('Error fetch users:', err));
  }, []);

  useEffect(() => {
    const fetchReorders = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/reorders`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const arr = res.data.data || [];
        const baseRows = arr.map(r => ({
          id: r.id,
          created_at: r.created_at,
          reorder_code: r.reorder_code,
          reorder_date: r.reorder_date,
          delivery_date: r.delivery_date,
          total_reorder_price: r.total_reorder_price,
          whatsapp_status: r.whatsapp_status,
          reorder_status: r.reorder_status,
          items: r.items || [],
          description: r.description || '',
          user_id: r.user_id,
          initial: '',
        }));
        const sorted = sortRows(baseRows);
        setAllRows(sorted);
        setRows(sorted);
        setTotalItems(sorted.length);
      } catch(err) {
        console.error('Error fetch reorders:', err);
        setError(err);
      }
    };
    fetchReorders();
  }, [location.key]);

  useEffect(() => {
    if (!users.length || !allRows.length) return;
    const updated = allRows.map(r => {
      const u = users.find(u => u.id === r.user_id) || {};
      return { ...r, initial: u.initial || u.name || '-' };
    });
    const sorted = sortRows(updated);
    setAllRows(sorted);
    const initials = Array.from(new Set(sorted.map(r => r.initial))).filter(v => v);
    setAutoOptions(initials);
    const filtered = sorted.filter(r => !searchTerm || r.initial.toLowerCase().includes(searchTerm.toLowerCase()));
    setRows(filtered);
    setTotalItems(filtered.length);
    setPage(0);
  }, [users, allRows.length]);

  useEffect(() => {
    const filtered = allRows.filter(r => !searchTerm || r.initial.toLowerCase().includes(searchTerm.toLowerCase()));
    setRows(filtered);
    setTotalItems(filtered.length);
    setPage(0);
  }, [searchTerm]);

  if (error) return <div>Error: {error.message}</div>;

  const renderWhatsAppStatus = (status) => {
    switch(status) {
      case 'belum_dikirim': return <Chip label="Belum Dikirim" size="small" />;
      case 'sudah_dikirim': return <Chip label="Sudah Dikirim" color="success" size="small" />;
      case 'gagal_dikirim': return <Chip label="Gagal Kirim" color="error" size="small" />;
      case 'update_belum_dikirim': return <Chip label="Update Belum Dikirim" color="warning" size="small" />;
      case 'update_sudah_dikirim': return <Chip label="Update Terkirim" color="success" size="small" />;
      case 'update_gagal_dikirim': return <Chip label="Gagal Update" color="error" size="small" />;
      case 'dibatalkan': return <Chip label="Dibatalkan" color="default" size="small" />;
      case 'selesai': return <Chip label="Selesai" color="primary" size="small" />;
      default: return <Chip label={status} size="small" />;
    }
  };
  const renderReorderStatus = (status) => {
    switch(status) {
      case 'draft': return <Chip label="Draft" size="small" />;
      case 'proses': return <Chip label="Proses" color="info" size="small" />;
      case 'selesai': return <Chip label="Selesai" color="primary" size="small" />;
      case 'dibatalkan': return <Chip label="Dibatalkan" color="default" size="small" />;
      default: return <Chip label={status} size="small" />;
    }
  };

  const eligibleUsers = users.filter(u =>
    String(u.position).toLowerCase() === 'rumah tangga' && String(u.role).toLowerCase() === 'staff'
  );

  const openSendModal = (row) => {
    setSelectedOrderForSend(row);
    const existing = eligibleUsers.find(u => u.id === row.user_id);
    setSelectedUserForSend(existing || null);
    setSendModalOpen(true);
  };
  const closeSendModal = () => {
    setSendModalOpen(false);
    setSelectedOrderForSend(null);
    setSelectedUserForSend(null);
  };

  const confirmSendWA = async () => {
    closeEdit(); closeDetail();
    if (!selectedOrderForSend || !selectedUserForSend) return;
    const id = selectedOrderForSend.id;
    const userId = selectedUserForSend.id;
    try {
      closeSendModal();
      const res = await axios.post(
        `${API_BASE_URL}/api/reorders/${id}/send`,
        { user_id: userId },
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      Swal.close();
      Swal.fire('Sukses', res.data.message || 'WA berhasil dikirim', 'success');
      const updated = res.data.data;
      const updatedAll = allRows.map(r => r.id === updated.id ? {
        ...r,
        whatsapp_status: updated.whatsapp_status,
        reorder_status: updated.reorder_status,
        sent_at: updated.sent_at,
        user_id: updated.user_id,
      } : r);
      const sortedAll = sortRows(updatedAll);
      setAllRows(sortedAll);
      const filtered = sortedAll.filter(r => !searchTerm || r.initial.toLowerCase().includes(searchTerm.toLowerCase()));
      setRows(filtered);
    } catch (err) {
      Swal.close();
      Swal.fire('Gagal', err.response?.data?.message || err.message, 'error');
    }
  };

  const sendUpdateWA = async (id) => {
    closeEdit(); closeDetail();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/reorders/${id}/update`, {}, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      Swal.close();
      Swal.fire('Sukses', res.data.message || 'Pembaruan WA berhasil dikirim', 'success');
      const updated = res.data.data;
      const updatedAll = allRows.map(r => r.id === updated.id ? {
        ...r,
        whatsapp_status: updated.whatsapp_status,
        reorder_status: updated.reorder_status,
      } : r);
      const sortedAll = sortRows(updatedAll);
      setAllRows(sortedAll);
      const filtered = sortedAll.filter(r => !searchTerm || r.initial.toLowerCase().includes(searchTerm.toLowerCase()));
      setRows(filtered);
    } catch (err) {
      Swal.close();
      Swal.fire('Gagal', err.response?.data?.message || err.message, 'error');
    }
  };

  const cancelWA = async (id) => {
    const confirm = await Swal.fire({
      title: 'Batalkan Reorder?',
      text: 'Yakin ingin membatalkan dan mengirim notifikasi pembatalan WA?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    try {
      closeDetail(); closeEdit();
      const res = await axios.post(`${API_BASE_URL}/api/reorders/${id}/cancel`, {}, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      Swal.close();
      Swal.fire('Dibatalkan', res.data.message || 'Reorder dibatalkan', 'success');
      const updated = res.data.data;
      const updatedAll = allRows.map(r => r.id === updated.id ? {
        ...r,
        whatsapp_status: updated.whatsapp_status,
        reorder_status: updated.reorder_status,
        cancelled_at: updated.cancelled_at,
      } : r);
      const sortedAll = sortRows(updatedAll);
      setAllRows(sortedAll);
      const filtered = sortedAll.filter(r => !searchTerm || r.initial.toLowerCase().includes(searchTerm.toLowerCase()));
      setRows(filtered);
    } catch (err) {
      Swal.close();
      Swal.fire('Gagal', err.response?.data?.message || err.message, 'error');
    }
  };

  const confirmAndDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Hapus Reorder?',
      text: 'Yakin ingin menghapus data ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });
    if (!isConfirmed) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/reorders/${id}`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      Swal.close();
      Swal.fire('Dihapus', 'Reorder berhasil dihapus.', 'success');
      const filteredAll = allRows.filter(r => r.id !== id);
      const sortedAll = sortRows(filteredAll);
      setAllRows(sortedAll);
      const filtered = sortedAll.filter(r => !searchTerm || r.initial.toLowerCase().includes(searchTerm.toLowerCase()));
      setRows(filtered);
      setTotalItems(filtered.length);
    } catch (err) {
      Swal.close();
      Swal.fire('Error', err.response?.data?.message || 'Gagal menghapus pemesanan.', 'error');
    }
  };

  const handleDelete = async (row) => {
    const ws = row.whatsapp_status;
    const rs = row.reorder_status;
    const canDeleteDirect = (ws === 'belum_dikirim' && rs === 'draft')
                        || (ws === 'dibatalkan' && rs === 'dibatalkan')
                        || (ws === 'update_sudah_dikirim' && rs === 'dibatalkan');
    if (canDeleteDirect) {
      await confirmAndDelete(row.id);
      return;
    }
    if (ws === 'update_belum_dikirim' && rs === 'dibatalkan') {
      const { isConfirmed } = await Swal.fire({
        title: 'Kirim Pembaruan WA Pembatalan?',
        text: 'Sebelum menghapus, kirim pembatalan WA agar status berubah ke update_sudah_dikirim. Lanjutkan?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Kirim & Hapus',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
      });
      if (!isConfirmed) return;
      try {
        await axios.post(`${API_BASE_URL}/api/reorders/${row.id}/update`, {}, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        Swal.close();
        Swal.fire('Terkirim', 'Pemberitahuan pembatalan WA berhasil dikirim.', 'success');
        await confirmAndDelete(row.id);
      } catch (err) {
        Swal.close();
        Swal.fire('Error', err.response?.data?.message || err.message, 'error');
      }
      return;
    }
    Swal.fire('Tidak Dapat Dihapus', 'Data ini belum dapat dihapus langsung. Silakan lakukan pembatalan atau pembaruan WA sesuai alur.', 'info');
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 1, px: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/barang')}
          sx={{ textTransform: 'capitalize' }}
        >
          Tambah Pemesanan
        </Button>
      </Box>
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
            options={autoOptions}
            getOptionLabel={opt => opt}
            sx={{ width: 200, ml: 1 }}
            value={searchTerm}
            onInputChange={(_, val) => setSearchTerm(val)}
            renderInput={params => <TextField {...params} size="small" />}
          />
        </Stack>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Kode Pesan</TableCell>
                <TableCell>Tgl Butuh</TableCell>
                <TableCell>Tgl Pengiriman</TableCell>
                <TableCell>Total Harga</TableCell>
                <TableCell>WhatsApp Status</TableCell>
                <TableCell>Pesan Status</TableCell>
                <TableCell align="left" sx={{ width: 10 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow hover key={row.id}>
                  <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>{row.reorder_code}</TableCell>
                  <TableCell>{formatDateOnly(row.reorder_date)}</TableCell>
                  <TableCell>{formatDateOnly(row.delivery_date)}</TableCell>
                  <TableCell>{formatRp(row.total_reorder_price)}</TableCell>
                  <TableCell>{renderWhatsAppStatus(row.whatsapp_status)}</TableCell>
                  <TableCell>{renderReorderStatus(row.reorder_status)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconButton size="small" onClick={() => openEdit(row)}>
                        <EditIcon sx={{ color: 'blue' }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(row)}>
                        <DeleteIcon sx={{ color: 'darkred' }} />
                      </IconButton>
                      {row.whatsapp_status === 'belum_dikirim' && row.reorder_status === 'draft' && (
                        <IconButton size="small" onClick={() => openSendModal(row)}>
                          <SendIcon sx={{ color: 'green' }} />
                        </IconButton>
                      )}
                      {row.whatsapp_status === 'gagal_dikirim' && (
                        <IconButton size="small" onClick={() => openSendModal(row)}>
                          <SendIcon sx={{ color: 'orange' }} />
                        </IconButton>
                      )}
                      {/* Jika update belum dikirim dan proses: tampilkan Cancel + Pembaruan */}
                      {row.whatsapp_status === 'update_belum_dikirim' && row.reorder_status === 'proses' && (
                        <>
                          {/* <IconButton size="small" onClick={() => cancelWA(row.id)}>
                            <CancelIcon sx={{ color: 'darkred' }} />
                          </IconButton> */}
                          <IconButton size="small" onClick={() => sendUpdateWA(row.id)}>
                            <SendIcon sx={{ color: 'blue' }} />
                          </IconButton>
                        </>
                      )}
                      {/* Jika update belum dikirim dan dibatalkan: tampilkan hanya Pembaruan WA */}
                      {row.whatsapp_status === 'update_belum_dikirim' && row.reorder_status === 'dibatalkan' && (
                        <IconButton size="small" onClick={() => sendUpdateWA(row.id)}>
                          <SendIcon sx={{ color: 'blue' }} />
                        </IconButton>
                      )}
                      {(row.whatsapp_status === 'sudah_dikirim' || row.whatsapp_status==='update_sudah_dikirim') && row.reorder_status==='proses' && (
                        <IconButton size="small" onClick={() => cancelWA(row.id)}>
                          <CancelIcon sx={{ color: 'darkred' }} />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => openDetail(row)}>
                        <InfoIcon sx={{ color: 'gray' }} />
                      </IconButton>
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

      {/* Modal pilih User sebelum Kirim WA */}
      <Modal open={sendModalOpen} onClose={closeSendModal} sx={modalStyle}>
        <Paper sx={panelStyle}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>Pilih User Rumah Tangga</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>User</Typography>
          <Autocomplete
            options={eligibleUsers}
            getOptionLabel={(option) => option.name || option.initial || ''}
            value={selectedUserForSend}
            onChange={(_, newValue) => setSelectedUserForSend(newValue)}
            renderInput={(params) => <TextField {...params}  placeholder="Cari user..." fullWidth />}
            sx={{ mb: 3 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="contained" color="error" onClick={closeSendModal} sx={{ textTransform: 'capitalize' }}>Batal</Button>
            <Button
              variant="contained"
              disabled={!selectedUserForSend}
              onClick={confirmSendWA}
              sx={{ textTransform: 'capitalize' }}
            >
              Kirim WA
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={closeDetail} sx={modalStyle}>
        <Paper sx={{ width: 450, height: '80vh', display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={closeDetail}><ArrowBackIosNewIcon/></IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', mr: 1 }}>Detail Pemesanan</Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
            {detailData?.items && detailData.items.length ? detailData.items.map(item => {
              const rawImage = item.product.image || '';
              const cleaned = rawImage.replace(/^\//, '');
              let imgSrc;
              if (/^https?:\/\//i.test(cleaned)) imgSrc = cleaned;
              else if (cleaned.startsWith('images/')) imgSrc = `${backendBase}/storage/${cleaned}`;
              else imgSrc = `${backendBase}/${cleaned}`;
              return (
                <Paper key={item.id} variant="outlined" sx={{ display: 'flex', alignItems: 'flex-start', p: 2, mb: 1 }}>
                  <Box
                    component="img"
                    src={imgSrc}
                    alt={item.product.name}
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `${backendBase}/assets/images/default_product.jpg`; }}
                    sx={{ width: 45, height: 45, ml: 0.5, mr: 2.5, objectFit: 'cover', borderRadius: 1 }}
                  />
                  <Box sx={{ flexGrow: 1, display: 'grid', gridTemplateColumns: '130px 1fr', columnGap: 2, rowGap: 1 }}>
                    <Typography variant="subtitle2">Nama Barang:</Typography>
                    <Typography variant="subtitle2">{item.product.name}</Typography>
                    <Typography variant="subtitle2">Jumlah dipesan:</Typography>
                    <Typography variant="subtitle2">{item.reorder_quantity}</Typography>
                    <Typography variant="subtitle2">Stok saat ini:</Typography>
                    <Typography variant="subtitle2">{item.product.stock}</Typography>
                    <Typography variant="subtitle2">Harga satuan:</Typography>
                    <Typography variant="subtitle2">{formatRp(item.original_price)}</Typography>
                    <Typography variant="subtitle2">Total harga:</Typography>
                    <Typography variant="subtitle2">{formatRp(item.total_product_price)}</Typography>
                  </Box>
                </Paper>
              );
            }) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Tidak ada barang</Typography>
              </Box>
            )}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#1976D2' }}>Tanggal Butuh</Typography>
              <Typography variant="subtitle2">{formatDateOnly(detailData?.reorder_date)}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#1976D2' }}>Tanggal Pengiriman</Typography>
              <Typography variant="subtitle2">{formatDateOnly(detailData?.delivery_date)}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#1976D2' }}>Total Harga</Typography>
              <Typography variant="subtitle2">{formatRp(detailData?.total_reorder_price)}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#1976D2' }}>WhatsApp Status</Typography>
              <Typography variant="subtitle2">{detailData?.whatsapp_status}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#1976D2' }}>Pesan Status</Typography>
              <Typography variant="subtitle2">{detailData?.reorder_status}</Typography>
              {detailData?.user_id && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#1976D2' }}>Dikirim ke</Typography>
                  <Typography variant="subtitle2">
                    {users.find(u => u.id === detailData.user_id)?.name || '-'}
                  </Typography>
                </>
              )}
              {detailData?.description && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#1976D2' }}>Deskripsi</Typography>
                  <Typography variant="subtitle2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', mt: 0 }}>
                    {detailData.description}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
          <Box sx={{ p: 2, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={closeDetail} sx={{ textTransform: 'capitalize', bgcolor: '#E4E6EF', color: 'black', '&:hover': { bgcolor: '#d1d3db' } }}>
              Tutup
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* EditPesan Modal */}
      <EditPesan open={editOpen} onClose={closeEdit} data={editData} onSave={handleSaveEdit} onDelete={handleDeleteFromEdit} />
    </>
  );
}
