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

  const [danaKeluar, setDanaKeluar] = useState(null);
  const [danaSisa, setDanaSisa] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const [selectedDate, setSelectedDate] = useState(
    getDefaultDate(currentYear, currentMonthIndex)
  );
  const [inputDanaMasukBaru, setInputDanaMasukBaru] = useState("");

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
    if (!selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Swal.fire("Peringatan", "Tanggal tidak valid.", "warning");
      return;
    }
    const [yStr, mStr, dStr] = selectedDate.split("-");
    const yNum = Number(yStr), mNum = Number(mStr);
    if (yNum !== year || mNum !== monthIndex + 1) {
      Swal.fire("Peringatan", `Tanggal harus di bulan ${MONTH_NAMES[monthIndex]} ${year}.`, "warning");
      return;
    }
    try {
      const dateForApi = convertToDDMMYYYY(selectedDate);
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

  const firstRowMonths = MONTH_NAMES.slice(0, 8);
  const secondRowMonths = MONTH_NAMES.slice(8);

  return (
    <Box sx={{ mt: 5, display: "flex", justifyContent: "center" }}>
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
        <Box sx={{ display: "flex", flexWrap: "wrap", mb: 1 }}>
          {firstRowMonths.map((name, idx) => (
            <Button
              key={name}
              onClick={() => handleMonthClick(idx)}
              variant={idx === monthIndex ? "contained" : "outlined"}
              sx={{ textTransform: "none", mr: 3.2, mb: 1, minWidth: 100 }}
            >
              {name}
            </Button>
          ))}
        </Box>
        {/* Bulan baris kedua */}
        <Box sx={{ display: "flex", flexWrap: "wrap", mb: 2 }}>
          {secondRowMonths.map((name, idx) => {
            const realIdx = 8 + idx;
            return (
              <Button
                key={name}
                onClick={() => handleMonthClick(realIdx)}
                variant={realIdx === monthIndex ? "contained" : "outlined"}
                sx={{ textTransform: "none", mr: 3.2, mb: 1, minWidth: 100 }}
              >
                {name}
              </Button>
            );
          })}
        </Box>
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
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 500 }}
              />
            </Grid>
          </Grid>

          {/* Dana Masuk */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography>Dana Masuk</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField
                value={inputDanaMasukBaru ? formatRupiah(inputDanaMasukBaru) : ""}
                onChange={handleInputDanaMasukBaru}
                placeholder="Masukkan Jumlah Dana Masuk"
                size="small"
                variant="outlined"
                sx={{ width: 500 }}
              />
            </Grid>
          </Grid>

          {/* Dana Keluar */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography>Dana Keluar</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField
                value={danaKeluar != null ? formatRupiah(danaKeluar) : ""}
                size="small"
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{ width: 500 }}
              />
            </Grid>
          </Grid>

          {/* Dana Sisa */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography>Dana Sisa</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField
                value={danaSisa != null ? formatRupiah(danaSisa) : ""}
                size="small"
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{ width: 500 }}
              />
            </Grid>
          </Grid>
          <Box sx={{ textAlign: "right", mr:31.5 }}>
            <Button variant="contained" onClick={handleSubmitDanaMasukBaru} >
              Simpan
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
