import React, { useEffect, useState, useMemo } from "react";
import axios from "./Api"; 
import { Link } from "react-router-dom";
import Sidenav from "../components/Sidenav";
import Navbar from "../components/Navbar";
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [fundsMonthly, setFundsMonthly] = useState([]); 
  const [fundsThisYearBalance, setFundsThisYearBalance] = useState(0);
  const [topProducts, setTopProducts] = useState([]); 

  const makeHeaders = () => {
    const headers = { "Accept": "application/json" };
    const base = import.meta.env.VITE_BASE_URL || "";
    if (base.includes("ngrok")) {
      headers["ngrok-skip-browser-warning"] = "true";
    }
    return headers;
  };

  useEffect(() => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const monthLabels = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];

    const fetchAllData = async () => {
      let arrProd = [];
      try {
        const respProd = await axios.get("/api/products", { headers: makeHeaders() });
        console.log("respProd.data:", respProd.data);
        if (respProd.data && respProd.data.data) {
          const d0 = respProd.data.data;
          if (Array.isArray(d0)) {
            arrProd = d0;
          } else if (d0.data && Array.isArray(d0.data)) {
            arrProd = d0.data;
          } else {
            console.warn("Struktur data produk tidak dikenali:", d0);
          }
        }
      } catch (err) {
        console.error("Error fetch /api/products:", err);
      }
      console.log("products:", arrProd);
      setProducts(arrProd);

      let arrChk = [];
      try {
        const respChk = await axios.get("/api/checkouts", { headers: makeHeaders() });
        console.log("respChk.data:", respChk.data);
        if (respChk.data && Array.isArray(respChk.data.data)) {
          arrChk = respChk.data.data;
        } else {
          console.warn("Struktur data checkouts tidak dikenali:", respChk.data);
        }
      } catch (err) {
        console.error("Error fetch /api/checkouts:", err);
      }
      console.log("checkouts:", arrChk);
      setCheckouts(arrChk);

      const promisesMonth = monthLabels.map((lbl, idx) => {
        const month = idx + 1;
        return axios.get("/api/funds", {
          params: { year: thisYear, month },
          headers: makeHeaders()
        })
        .then(resp => {
          console.log(`resp /api/funds?year=${thisYear}&month=${month}:`, resp.data);
          const data = resp.data;
          let outVal = 0;
          if (Array.isArray(data.transactions)) {
            outVal = data.transactions
              .filter(tx => tx.type === "out")
              .reduce((s, tx) => s + Number(tx.amount), 0);
          } else if (data.out != null) {
            outVal = Number(data.out);
          }
          return { month: lbl, value: outVal };
        })
        .catch(err => {
          console.warn(`Error fetch fund month ${month}:`, err);
          return { month: lbl, value: 0 };
        });
      });
      try {
        const resultsMonth = await Promise.all(promisesMonth);
        console.log("fundsMonthly:", resultsMonth);
        setFundsMonthly(resultsMonth);
      } catch(err) {
        console.error("Error fetching fundsMonthly:", err);
        setFundsMonthly([]);
      }

      const promisesAcc = monthLabels.map((_, idx) => {
        const month = idx + 1;
        return axios.get("/api/funds", {
          params: { year: thisYear, month },
          headers: makeHeaders()
        })
        .then(resp => {
          const data = resp.data;
          let inVal = 0, outVal = 0;
          if (Array.isArray(data.transactions)) {
            data.transactions.forEach(tx => {
              if (tx.type === "in") inVal += Number(tx.amount);
              else if (tx.type === "out") outVal += Number(tx.amount);
            });
          } else {
            if (data.in != null) inVal = Number(data.in);
            if (data.out != null) outVal = Number(data.out);
          }
          return { inVal, outVal };
        })
        .catch(err => {
          console.warn(`Error fetch fund month ${month} for acc:`, err);
          return { inVal: 0, outVal: 0 };
        });
      });
      try {
        const arrAcc = await Promise.all(promisesAcc);
        const totalIn = arrAcc.reduce((s, m) => s + m.inVal, 0);
        const totalOut = arrAcc.reduce((s, m) => s + m.outVal, 0);
        console.log("totalIn:", totalIn, "totalOut:", totalOut);
        setFundsThisYearBalance(totalIn - totalOut);
      } catch(err) {
        console.error("Error menghitung total sisa dana tahun ini:", err);
        setFundsThisYearBalance(0);
      }

      const freqProd = {};
      arrChk.forEach(c => {
        if (Array.isArray(c.items)) {
          c.items.forEach(item => {
            const name = item.product?.name || "Unknown";
            const qty = Number(item.checkout_quantity) || 1;
            freqProd[name] = (freqProd[name] || 0) + qty;
          });
        }
      });
      const sortedProd = Object.entries(freqProd)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, cnt]) => ({ name, count: cnt }));
      console.log("topProducts:", sortedProd);
      setTopProducts(sortedProd);
    };

    fetchAllData();
  }, []);

  const barChartPengeluaranPerBulan = (fundsMonthlyArr) => {
    console.log("Render barChartPengeluaranPerBulan, data:", fundsMonthlyArr);
    if (!fundsMonthlyArr || fundsMonthlyArr.length === 0) {
      return <Typography variant="body2" color="text.secondary">Tidak ada data</Typography>;
    }
    const values = fundsMonthlyArr.map(d => Number(d.value) || 0);
    const maxVal = Math.max(...values, 1);
    return (
      <Box
        sx={{
          position: 'relative',
          height: 220,
          px: 2,
          border: '1px solid red',     
          bgcolor: '#fff'
        }}
      >
 
        {[0.25, 0.5, 0.75, 1].map((frac, idx) => (
          <Box key={idx}
            sx={{
              position: 'absolute',
              bottom: `${frac * 100}%`,
              left: 0, right: 0,
              borderTop: '1px dashed #ccc',
              zIndex: 1,
            }}
          />
        ))}
        {/* Baseline */}
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderBottom: '2px solid #888', zIndex: 2 }} />
        {/* Bars */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', position: 'relative', zIndex: 3 }}>
          {fundsMonthlyArr.map((d, idx) => {
            const val = Number(d.value) || 0;
            const heightPct = (val / maxVal) * 100;
            console.log(`Bar ${d.month}: val=${val}, heightPct=${heightPct}`);
            return (
              <Box key={idx} sx={{ flex: 1, mx: 0.5, textAlign: 'center' }}>
                <Box
                  sx={{
                    height: `${heightPct}%`,
                    minHeight: val > 0 ? 4 : 0,  
                    bgcolor: val > 0 ? 'red' : '#e0e0e0',
                    borderRadius: 1,
                  }}
                  title={`${d.month}: ${new Intl.NumberFormat("id-ID").format(val)}`}
                />
                <Typography variant="caption" sx={{ mt: 0.5 }}>{d.month}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const stokByKategori = useMemo(() => {
    const freq = {};
    products.forEach(p => {
      const cat = p.category?.name || "Unknown";
      freq[cat] = (freq[cat] || 0) + (Number(p.stock) || 0);
    });
    const arr = Object.entries(freq).map(([name, stock]) => ({ name, stock }));
    arr.sort((a, b) => b.stock - a.stock);
    console.log("stokByKategori:", arr);
    return arr;
  }, [products]);

  const barChartStokPerKategori = (arrKategori) => {
    console.log("Render barChartStokPerKategori, data:", arrKategori);
    if (!arrKategori || arrKategori.length === 0) {
      return <Typography variant="body2" color="text.secondary">Tidak ada data</Typography>;
    }
    const stocks = arrKategori.map(d => Number(d.stock) || 0);
    const maxVal = Math.max(...stocks, 1);
    return (
      <Box
        sx={{
          position: 'relative',
          height: 220,
          px: 2,
          border: '1px solid blue',   
          bgcolor: '#fff',
        }}
      >
        {[0.25, 0.5, 0.75, 1].map((frac, idx) => (
          <Box key={idx}
            sx={{
              position: 'absolute',
              bottom: `${frac * 100}%`,
              left: 0, right: 0,
              borderTop: '1px dashed #ccc',
              zIndex: 1,
            }}
          />
        ))}
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderBottom: '2px solid #888', zIndex: 2 }} />
        <Box sx={{
            display: 'flex',
            alignItems: 'flex-end',
            height: '100%',
            position: 'relative',
            zIndex: 3,
            overflowX: 'auto'
          }}
        >
          {arrKategori.map((d, idx) => {
            const val = Number(d.stock) || 0;
            const heightPct = (val / maxVal) * 100;
            console.log(`Stok Bar ${d.name}: val=${val}, heightPct=${heightPct}`);
            return (
              <Box key={idx} sx={{ width: 50, mx: 0.5, textAlign: 'center', flexShrink: 0 }}>
                <Box
                  sx={{
                    height: `${heightPct}%`,
                    minHeight: val > 0 ? 10 : 0, 
                    bgcolor: '#1976d2',
                    borderRadius: 1,
                  }}
                  title={`${d.name}: ${val}`}
                />

                <Typography variant="caption" sx={{
                    mt: 0.5,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    fontSize: '0.65rem'
                  }}
                >
                  {d.name.length > 10 ? d.name.slice(0, 10) + '…' : d.name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const uniqueCategoriesCount = Array.from(new Set(products.map(p => p.category?.name).filter(x => x))).length;
  const permintaanBaruCount = checkouts.length;

  return (
    <div className="bgcolor">
      <Navbar />
      <Box height={70} />
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {/* Judul & Breadcrumb */}
          <Typography variant="h4" gutterBottom>Dashboard</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary', fontSize: 14 }}>
            <Link to="/home" style={{ color: '#888', textDecoration: 'none' }}>Home</Link>
            <Box sx={{ mx: 1 }}>•</Box>
            <Box>Dashboard</Box>
          </Box>

          {/* Cards Ringkasan */}
          <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card sx={{ backgroundColor: '#E3F2FD', color: '#0D47A1' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Inventory2Icon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Total Stok Barang</Typography>
                  </Box>
                  <Typography variant="h5">{totalStock}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card sx={{ backgroundColor: '#E3F2FD', color: '#0D47A1' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CategoryIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Total Kategori Barang</Typography>
                  </Box>
                  <Typography variant="h5">{uniqueCategoriesCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card sx={{ backgroundColor: '#E3F2FD', color: '#0D47A1' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MonetizationOnIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Total Sisa Dana Tahun Ini</Typography>
                  </Box>
                  <Typography variant="h5">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
                      .format(fundsThisYearBalance)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card sx={{ backgroundColor: '#E3F2FD', color: '#0D47A1' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AssignmentTurnedInIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Permintaan Baru</Typography>
                  </Box>
                  <Typography variant="h5">{permintaanBaruCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Grafik & Daftar */}
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2}>
                
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Grafik Pengeluaran per Bulan ({new Date().getFullYear()})
                    </Typography>
                    {barChartPengeluaranPerBulan(fundsMonthly)}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Grafik Stok per Kategori
                    </Typography>
                    {barChartStokPerKategori(stokByKategori)}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={2}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Barang yang Paling Banyak Diambil Staf
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    {topProducts && topProducts.length > 0 ? (
                      topProducts.map((p, i) => (
                        <Box key={i} sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Diambil: {p.count} kali
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">Tidak ada data</Typography>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>

        </Box>
      </Box>
    </div>
  );
}
