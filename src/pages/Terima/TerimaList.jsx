import * as React from 'react';
import { useState, useEffect } from 'react';
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
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Modal from '@mui/material/Modal';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Swal from 'sweetalert2';
import AddTerima from './AddTerima';
import EditTerima from './EditTerima';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const backendBase = API_BASE_URL.replace(/\/$/, '');

const modalStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'rgba(0,0,0,0.5)',
  p: 2,
};
const detailPaperStyle = {
  width: 450,
  height: '80vh',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 2,
  overflow: 'hidden',
};

export default function TerimaList() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [allRows, setAllRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoOptions, setAutoOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [formData, setFormData] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const formatDateOnly = dateStr => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2,'0');
    const month = String(d.getMonth()+1).padStart(2,'0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const formatRp = value => {
    if (value == null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(value);
  };
  const renderReceivedStatus = status => {
    switch(status) {
      case 'pending': return <Chip label="Pending" size="small" />;
      case 'selesai': return <Chip label="Selesai" color="primary" size="small" />;
      case 'dibatalkan': return <Chip label="Dibatalkan" color="default" size="small" />;
      default: return <Chip label={status} size="small" />;
    }
  };

  const openAddModal = () => setOpenAdd(true);
  const closeAddModal = () => setOpenAdd(false);
  const openEditModal = () => setOpenEdit(true);
  const closeEditModal = () => setOpenEdit(false);

  const fetchReceived = async (pageArg = 1, limitArg = rowsPerPage) => {
    setLoading(true);
    try {
      const params = { page: pageArg, limit: limitArg };
      const response = await axios.get(`${API_BASE_URL}/api/product-received`, {
        params,
        headers: { 'Accept':'application/json','ngrok-skip-browser-warning':'true' }
      });
      const data = response?.data?.data;
      const items = data?.data || [];
      const baseRows = items
        .sort((a,b)=> new Date(b.received_date) - new Date(a.received_date))
        .map(item=>({
          id: item.id,
          reorderId: item.reorder_id,
          date: item.received_date,
          status: item.received_status,
          createdAt: item.created_at,
          totalPrice: item.total_received_price,
          reorderCode: '',
        }));
      const withCodes = await Promise.all(baseRows.map(async rowItem => {
        try {
          const resp = await axios.get(`${API_BASE_URL}/api/reorders/${rowItem.reorderId}`, {
            headers: { 'Accept':'application/json','ngrok-skip-browser-warning':'true' }
          });
          const code = resp.data.data?.reorder_code || '';
          return {...rowItem, reorderCode: code};
        } catch (e) {
          console.error('Fetch reorder_code error:', e);
          return rowItem;
        }
      }));
      setAllRows(withCodes);
      if (searchTerm) {
        const filtered = withCodes.filter(r => r.reorderCode.toLowerCase().includes(searchTerm.toLowerCase()));
        setRows(filtered);
      } else {
        setRows(withCodes);
      }
    } catch (err) {
      console.error('Error fetching received data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchReceived(1, rowsPerPage);
  }, [rowsPerPage]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allRows.filter(r => r.reorderCode.toLowerCase().includes(searchTerm.toLowerCase()));
      setRows(filtered);
    } else {
      setRows(allRows);
    }
    setPage(0);
  }, [searchTerm, allRows]);

  const fetchSuggestions = async term => {
    if (!term) {
      const opts = allRows.map(r => r.reorderCode).filter(Boolean);
      setAutoOptions(opts);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const resp = await axios.get(`${API_BASE_URL}/api/reorders`,{
        params:{ search: term, page:1, limit:10 },
        headers:{ 'Accept':'application/json','ngrok-skip-browser-warning':'true' }
      });
      const arr = resp.data.data?.data || [];
      const opts = arr.map(item=>item.reorder_code).filter(Boolean);
      setAutoOptions(opts);
    } catch(err){
      console.error('Error fetching suggestions:',err);
      const opts = allRows
        .filter(r => r.reorderCode.toLowerCase().includes(term.toLowerCase()))
        .map(r => r.reorderCode);
      setAutoOptions(opts);
    } finally { setLoadingSuggestions(false); }
  };

  const handleChangePage = (e,newPage)=>{
    setPage(newPage);
    if (!searchTerm) fetchReceived(newPage+1, rowsPerPage);
  };
  const handleChangeRowsPerPage = e=>{
    const newLimit=+e.target.value;
    setRowsPerPage(newLimit);
    setPage(0);
  };

  const handleEdit = row => {
    if (row.status === 'selesai') {
        Swal.fire('Info', 'Tidak dapat mengedit penerimaan yang telah selesai.', 'info');
        return;
    } else if (row.status === 'diretur') {
        Swal.fire('Info', 'Tidak dapat mengedit penerimaan yang telah diretur.', 'info');
        return;
    }
    setFormData(row);
    openEditModal();
  };

  const handleComplete = row =>{
    if(row.status==='selesai' || row.status==='diretur') return;
    Swal.fire({
      title:'Tandai selesai?', text:'Yakin menandai penerimaan ini selesai?', icon:'question',
      showCancelButton:true, confirmButtonText:'Ya', cancelButtonText:'Batal'
    }).then(result=>{
      if(result.isConfirmed){
        axios.patch(`${API_BASE_URL}/api/product-received/${row.id}/complete`, null, {
          headers:{ 'ngrok-skip-browser-warning':'true' }
        }).then(()=>{
          Swal.fire('Selesai','Penerimaan telah ditandai selesai.','success');
          fetchReceived(page+1, rowsPerPage);
        }).catch(err=>{
          console.error(err);
          Swal.fire('Error','Gagal memperbarui status.', 'error');
        });
      }
    });
  };

  const openDetailModal = async row => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/api/product-received/${row.id}`, {
        headers: { 'Accept':'application/json','ngrok-skip-browser-warning':'true' }
      });
      const data = resp.data.data;
      let reorderCode = '';
      let reorderItems = [];
      if (data.reorder && data.reorder.id) {
        try {
          const r = await axios.get(`${API_BASE_URL}/api/reorders/${data.reorder.id}`, {
            headers: { 'Accept':'application/json','ngrok-skip-browser-warning':'true' }
          });
          reorderCode = r.data.data?.reorder_code || '';
          reorderItems = r.data.data?.items || [];
        } catch(err) {
          console.error('Error fetching reorder info:', err);
        }
      }
      const mappedDetails = (data.details || []).map(item => {
        const unitPrice = item.price ?? item.product?.price ?? 0;
        const qtyReceived = item.received_quantity ?? 0;
        const total_product_price = item.total_product_price ?? qtyReceived * unitPrice;
        const reorderItem = reorderItems.find(ri => ri.product_id === item.product_id);
        const qtyOrdered = reorderItem?.reorder_quantity ?? '-';
        return {
          ...item,
          price: unitPrice,
          total_product_price,
          qtyOrdered,
        };
      });
      setDetailData({
        id: data.id,
        details: mappedDetails,
        date: data.received_date,
        status: data.received_status,
        totalPrice: data.total_received_price,
        reorderCode,
        createdAt: data.created_at,
      });
      setDetailOpen(true);
    } catch(err) {
      console.error('Error fetching detail:', err);
      Swal.fire('Error', 'Gagal mengambil detail penerimaan.', 'error');
    }
  };
  const closeDetailModal = () => setDetailOpen(false);

  if(error) return <div>Error: {error.message}</div>;

  return (
    <>
      <Modal open={openAdd} onClose={closeAddModal} sx={modalStyle}>
        <AddTerima CloseEvent={closeAddModal} onSuccess={()=>{ closeAddModal(); fetchReceived(1,rowsPerPage); }}/>
      </Modal>
      <Modal open={openEdit} onClose={closeEditModal} sx={modalStyle}>
        <EditTerima CloseEvent={closeEditModal} formData={formData} onSuccess={()=>{ closeEditModal(); fetchReceived(page+1,rowsPerPage); }}/>
      </Modal>
      <Modal open={detailOpen} onClose={closeDetailModal} sx={modalStyle}>
        <Paper sx={detailPaperStyle}>
          <Box sx={{ p:2, borderBottom:'1px solid #ddd', display:'flex', alignItems:'center' }}>
            <IconButton onClick={closeDetailModal}><ArrowBackIosNewIcon/></IconButton>
            <Typography variant="h6" sx={{ flexGrow:1, textAlign:'center', mr:1 }}>Detail Penerimaan</Typography>
          </Box>
          <Box sx={{ flex:1, overflowY:'auto', p:2, bgcolor:'#f5f5f5' }}>
            {detailData?.details?.length ? detailData.details.map(item=>{
              const rawImage=item.product?.image||'';
              const cleaned=rawImage.replace(/^\//,'');
              let imgSrc;
              if(/^https?:\/\//i.test(cleaned)) imgSrc=cleaned;
              else if(cleaned.startsWith('images/')) imgSrc=`${backendBase}/storage/${cleaned}`;
              else imgSrc=`${backendBase}/${cleaned}`;
              return (
                <Paper key={item.id} variant="outlined" sx={{ display:'flex', alignItems:'flex-start', p:2, mb:1 }}>
                  <Box component="img" src={imgSrc} alt={item.product?.name}
                    onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=`${backendBase}/assets/images/default_product.jpg`;}}
                    sx={{ width:45,height:45,objectFit:'cover',borderRadius:1,mr:2 }} />
                  <Box sx={{ flexGrow:1, display:'grid', gridTemplateColumns:'130px 1fr', columnGap:2, rowGap:1 }}>
                    <Typography variant="subtitle2">Nama Barang:</Typography>
                    <Typography variant="subtitle2">{item.product?.name}</Typography>
                    <Typography variant="subtitle2">Jumlah Dipesan:</Typography>
                    <Typography variant="subtitle2">{item.qtyOrdered}</Typography>
                    <Typography variant="subtitle2">Jumlah Diterima:</Typography>
                    <Typography variant="subtitle2">{item.received_quantity}</Typography>
                    <Typography variant="subtitle2">Harga/unit:</Typography>
                    <Typography variant="subtitle2">{formatRp(item.price)}</Typography>
                    <Typography variant="subtitle2">Total Harga:</Typography>
                    <Typography variant="subtitle2">{formatRp(item.total_product_price)}</Typography>
                  </Box>
                </Paper>
              );
            }) : (
              <Box sx={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Typography color="text.secondary">Tidak ada detail barang</Typography>
              </Box>
            )}
            <Box sx={{ mt:2,p:2,bgcolor:'white',borderRadius:1,boxShadow:1 }}>
              <Typography variant="subtitle2" sx={{ mt:1,mb:1,color:'#1976D2' }}>Kode Pesanan</Typography>
              <Typography variant="subtitle2" sx={{ mb:2 }}>{detailData?.reorderCode}</Typography>              
              <Typography variant="subtitle2" sx={{ mb:1,color:'#1976D2' }}>Tanggal Diterima</Typography>
              <Typography variant="subtitle2">{formatDateOnly(detailData?.date)}</Typography>
              <Typography variant="subtitle2" sx={{ mt:2,mb:1,color:'#1976D2' }}>Status</Typography>
              <Typography variant="subtitle2">{detailData?.status}</Typography>
              <Typography variant="subtitle2" sx={{ mt:2,mb:1,color:'#1976D2' }}>Total Harga</Typography>
              <Typography variant="subtitle2">{formatRp(detailData?.totalPrice)}</Typography>
            </Box>
          </Box>
          <Box sx={{ p:2,borderTop:'1px solid #ddd', display:'flex', justifyContent:'flex-end' }}>
            <Button variant="contained" onClick={closeDetailModal} sx={{ textTransform:'capitalize', bgcolor:'#E4EEF', color:'black', '&:hover':{bgcolor:'#d1d3db'} }}>Tutup</Button>
          </Box>
        </Paper>
      </Modal>

      <Box sx={{ display:'flex', justifyContent:'flex-end', mb:2, mr:2.5 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAddModal} sx={{ textTransform:'capitalize' }}>Tambah Penerimaan</Button>
      </Box>

      <Paper sx={{ width:'100%', overflow:'hidden' }}>
        <Divider />
        <Box height={10} />
        <Stack direction="row" alignItems="center" sx={{ px:2, mb:2 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
            <Typography variant="body2">Show</Typography>
            <TextField
              select size="small" value={rowsPerPage} onChange={handleChangeRowsPerPage}
              SelectProps={{ native:true }} sx={{ width:64 }}>
              {[10,25,100].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </TextField>
            <Typography variant="body2">Entries</Typography>
          </Box>
          <Box sx={{ flexGrow:1 }} />
          <Typography variant="body2" sx={{ mr:1 }}>Search:</Typography>
          <Autocomplete
            freeSolo
            openOnFocus
            loading={loadingSuggestions}
            options={autoOptions}
            inputValue={searchTerm}
            onInputChange={(_, v) => setSearchTerm(v)}
            onFocus={() => fetchSuggestions(searchTerm || '')}
            filterOptions={opts => opts}
            renderInput={params => (
              <TextField
                {...params}
                size="small"
                sx={{ width:200 }}
                placeholder="Kode Pesanan"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingSuggestions ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Stack>

        {loading ? (
          <Box sx={{ display:'flex', justifyContent:'center', p:2 }}><CircularProgress size={24}/></Box>
        ) : (
          <TableContainer sx={{ maxHeight:440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Kode Pesan</TableCell>
                  <TableCell>Tanggal Dibuat</TableCell>
                  <TableCell>Tanggal Diterima</TableCell>
                  <TableCell>Total Harga</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="left" sx={{ width: 10 }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.slice(page*rowsPerPage, page*rowsPerPage+rowsPerPage).map((row, idx)=>(
                  <TableRow hover key={row.id}>
                    <TableCell>{page*rowsPerPage + idx +1}</TableCell>
                    <TableCell>{row.reorderCode || '-'}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleString('id-ID')}</TableCell>
                    <TableCell>{formatDateOnly(row.date)}</TableCell>
                    <TableCell>{formatRp(row.totalPrice)}</TableCell>
                    <TableCell>{renderReceivedStatus(row.status)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} justifyContent="flex-start">
                        <Tooltip title="Edit">
                          <span>
                            <IconButton size="small" onClick={()=>handleEdit(row)} disabled={row.status==='selesai' || row.status==='diretur'}>
                              <EditIcon color={row.status!=='selesai' && row.status!=='diretur'?'primary':'disabled'} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {row.status !== 'selesai' && row.status !== 'diretur' && (
                          <Tooltip title="Selesai">
                            <IconButton size="small" color="success" onClick={()=>handleComplete(row)}>
                              <CheckCircleOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Detail">
                          <IconButton size="small" onClick={()=>openDetailModal(row)}>
                            <InfoIcon sx={{color:'gray'}}/>
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length===0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center"><Typography color="text.secondary">Tidak ada data</Typography></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[10,25,100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage=""
          sx={{ '& .MuiTablePagination-selectLabel':{display:'none'}, '& .MuiTablePagination-input':{display:'none'} }}
        />
      </Paper>
    </>
  );
}
