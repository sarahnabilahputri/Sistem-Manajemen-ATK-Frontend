import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Grid,
  Divider,
  Modal,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatRupiah(value) {
  if (value == null || value === "" || isNaN(Number(value))) return "";
  const num = Number(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function getDefaultDate(year, monthIndex) {
  const today = new Date();
  if (today.getFullYear() === year && today.getMonth() === monthIndex) {
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${mm}-${dd}`;
  }
  const mm = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${mm}-01`;
}

function convertToDDMMYYYY(isoDate) {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate; 
  const [year, month, day] = parts;
  return `${day}-${month}-${year}`;
}

export default function DanaBAAK() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  const [year, setYear] = useState(currentYear);
  const [monthIndex, setMonthIndex] = useState(currentMonthIndex);

  const [danaMasukDefault, setDanaMasukDefault] = useState(0);
  const [danaKeluar, setDanaKeluar] = useState(null);
  const [danaSisa, setDanaSisa] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportRange, setExportRange] = useState({
    startDate: '',
    endDate: ''
  });

  const [selectedDate, setSelectedDate] = useState(
    getDefaultDate(currentYear, currentMonthIndex)
  );
  const [inputDanaMasukBaru, setInputDanaMasukBaru] = useState("");

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const role = user?.role;

  const openExport = () => setExportOpen(true);
  const closeExport = () => setExportOpen(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type");
    const headers = {};
    if (token && tokenType) {
      headers.Authorization = `${tokenType} ${token}`;
    }
    headers["ngrok-skip-browser-warning"] = "true";
    return headers;
  };

  useEffect(() => {
    const defDate = getDefaultDate(year, monthIndex);
    setSelectedDate(defDate);
    setInputDanaMasukBaru("");
    fetchDana();
  }, [year, monthIndex]);

  const fetchDana = async () => {
    setLoadingData(true);
    try {
      const monthParam = monthIndex + 1;
      const url = `${API_BASE_URL}/api/funds?year=${year}&month=${monthParam}`;
      const res = await axios.get(url, {
        headers: {
          Accept: "application/json",
          ...getAuthHeader(),
        },
      });
      const resp = res.data;
      if (typeof resp !== "object") {
        throw new Error("Unexpected response format");
      }
      const outNum = resp.out != null ? Number(resp.out) : 0;
      const balanceNum = resp.balance != null ? Number(resp.balance) : 0;
      setDanaMasukDefault(Number(resp.in || 0));
      setDanaKeluar(outNum);
      setDanaSisa(balanceNum);
    } catch (err) {
      console.error("[DanaBAAK] Error GET dana:", err.response ? err.response.data : err.message);
      if (err.response) {
        const msg = err.response.data?.message || JSON.stringify(err.response.data);
        Swal.fire("Error", msg, "error");
      } else {
        Swal.fire("Error", err.message, "error");
      }
      setDanaKeluar(null);
      setDanaSisa(null);
    } finally {
      setLoadingData(false);
    }
  };

  const handleYearChange = (e) => setYear(Number(e.target.value));
  const handleMonthClick = (idx) => setMonthIndex(idx);
  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleInputDanaMasukBaru = (e) => {
    const numeric = e.target.value.replace(/\D/g, "");
    setInputDanaMasukBaru(numeric);
  };

  const handleSubmitDanaMasukBaru = async () => {
    if (!inputDanaMasukBaru || Number(inputDanaMasukBaru) <= 0) {
      Swal.fire("Peringatan", "Masukkan Jumlah Dana Masuk yang valid.", "warning");
      return;
    }
    const todayIso = new Date().toISOString().split("T")[0];
    const [yStr, mStr] = todayIso.split("-");
    const yNum = Number(yStr), mNum = Number(mStr);
    if (yNum !== year || mNum !== monthIndex + 1) {
      Swal.fire("Peringatan", `Tanggal harus di bulan ${MONTH_NAMES[monthIndex]} ${year}.`, "warning");
      return;
    }
    try {
      const dateForApi = convertToDDMMYYYY(todayIso);
      const payload = {
        type: "in",
        amount: inputDanaMasukBaru,
        date: dateForApi,
      };
      const url = `${API_BASE_URL}/api/funds`;
      console.log("[DanaBAAK] POST URL:", url, "payload:", payload);
      const res = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...getAuthHeader(),
        },
      });
      console.log("[DanaBAAK] POST response:", res.status, res.data);
      Swal.fire("Berhasil", "Dana masuk berhasil ditambahkan.", "success");
      fetchDana();
      setInputDanaMasukBaru("");
    } catch (err) {
      console.error("[DanaBAAK] Error POST dana masuk:", err.response ? err.response.data : err.message);
      if (err.response) {
        const msg = err.response.data?.message || JSON.stringify(err.response.data);
        Swal.fire("Error", msg, "error");
      } else {
        Swal.fire("Error", err.message, "error");
      }
    }
  };

  const firstRowMonths = MONTH_NAMES.slice(0, 12);
  const secondRowMonths = MONTH_NAMES.slice(8);
  const formatDMY = isoDate => {
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleExport = async () => {
    const { startDate, endDate } = exportRange;
    if (!startDate || !endDate) {
      Swal.fire('Oops', 'Rentang tanggal wajib diisi.', 'warning');
      return;
    }

    setExporting(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/export-report`,  
        {
          params: { start_date: startDate, end_date: endDate },
          responseType: 'blob',
          headers: { ...getAuthHeader() }
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = res.headers['content-disposition'];
      const start = formatDMY(startDate);  
      const end   = formatDMY(endDate);    
      const filename = `Report ${start} – ${end}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Gagal mengekspor data.', 'error');
    } finally {
      setExporting(false);
      closeExport();
    }
  };

  return (
    <>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mr:2 }}>
      {role !== "Kabag" && (
      <Button
        variant="contained"
        onClick={openExport}
        disabled={exporting}
        startIcon={<img src="/Icon/export.png" alt="Export" width={15} height={15} />}
        sx={{ textTransform: 'capitalize', bgcolor: '#09C690', '&:hover': { bgcolor: '#07a574' } }}
      >
        {exporting ? 'Exporting...' : 'Export'}
      </Button>
      )}
    </Box>
    <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
      <Paper elevation={1} sx={{ width: "100%", p: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            Tahun
          </Typography>
          <FormControl size="small">
            <Select value={year} onChange={handleYearChange}>
              {Array.from({ length: 7 }).map((_, idx) => {
                const y = currentYear - 3 + idx;
                return <MenuItem key={y} value={y}>{y}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Box>
        {/* Bulan baris pertama */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {firstRowMonths.map((name, idx) => (
            <Grid size = {{xs: 3, sm : 2, md : 3, lg : 2, key : name}}>
              <Button
                fullWidth
                onClick={() => handleMonthClick(idx)}
                variant={idx === monthIndex ? "contained" : "outlined"}
                sx={{ textTransform: "none" }}
              >
                {name}
              </Button>
            </Grid>
          ))}
        </Grid>
        {/* Bulan baris kedua
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {secondRowMonths.map((name, idx) => {
            const realIdx = 8 + idx;
            return (
              <Grid item xs={6} sm={4} md={3} lg={2} key={name}>
                <Button
                  fullWidth
                  onClick={() => handleMonthClick(realIdx)}
                  variant={realIdx === monthIndex ? "contained" : "outlined"}
                  sx={{ textTransform: "none" }}
                >
                  {name}
                </Button>
              </Grid>
            );
          })}
        </Grid> */}
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Kelola Dana BAAK Bulan {MONTH_NAMES[monthIndex]} {year}
        </Typography>
        <Box component="form" noValidate autoComplete="off">
          {/* Tanggal */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography>Tanggal</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                value={getDefaultDate(year, monthIndex)}
                disabled
                size="small"
                InputLabelProps={{ shrink: true }}
                // sx={{ width: 500 }}
              />
            </Grid>
          </Grid>

          {/* Dana Masuk */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography>Dana Masuk</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {role === "Kabag" ? (
                <TextField
                  fullWidth
                  value={ formatRupiah(danaMasukDefault) }
                  size="small"
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  // sx={{ width: 500 }}
                />
              ) : (
              <TextField
                value={inputDanaMasukBaru ? formatRupiah(inputDanaMasukBaru) : ""}
                onChange={handleInputDanaMasukBaru}
                placeholder="Masukkan Jumlah Dana Masuk"
                size="small"
                variant="outlined"
                fullWidth
              />
              )}
            </Grid>
          </Grid>

           {/* Total Dana Masuk */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography>Total Dana Masuk</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                value={ formatRupiah(danaMasukDefault) }
                size="small"
                disabled
                InputProps={{ readOnly: true }}
                variant="outlined"
                // sx={{ width: 500 }}
              />
            </Grid>
          </Grid>

          {/* Dana Keluar */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography>Dana Keluar</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                value={danaKeluar != null ? formatRupiah(danaKeluar) : ""}
                size="small"
                disabled
                InputProps={{ readOnly: true }}
                variant="outlined"
                // sx={{ width: 500 }}
              />
            </Grid>
          </Grid>

          {/* Dana Sisa */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography>Dana Sisa</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                value={danaSisa != null ? formatRupiah(danaSisa) : ""}
                size="small"
                disabled
                InputProps={{ readOnly: true }}
                variant="outlined"
                // sx={{ width: 500 }}
              />
            </Grid>
          </Grid>
           {role !== "Kabag" && (
              <Grid container sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, sm: 9 }} sx={{ textAlign: "right" }}>
                  <Button variant="contained" onClick={handleSubmitDanaMasukBaru}>
                    Simpan
                  </Button>
                </Grid>
              </Grid>
            )}
        </Box>
      </Paper>
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
          <Box sx={{ p: 2, ml: 1 }}>
            <Typography variant="h7" fontWeight="bold">
              Export Data Dana BAAK
            </Typography>
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
              startIcon={
                <Box component="img" src="/Icon/export.png" sx={{ width:15, height:15 }} />
              }
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
    </Box>
    </>
  );
}
