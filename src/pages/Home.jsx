import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidenav from '../components/Sidenav';
import Navbar from '../components/Navbar';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider
} from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [funds, setFunds] = useState({ balance: 0, transactions: [] });
  const [checkouts, setCheckouts] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const headers = { 'ngrok-skip-browser-warning': 'true', Accept: 'application/json' };
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    axios.get(`${API_BASE_URL}/api/products`, { headers })
      .then(res => setProducts(res.data.data.data || []))
      .catch(() => setProducts([]));

    axios.get(`${API_BASE_URL}/api/categories`, { headers })
      .then(res => setCategories(res.data.data.data || []))
      .catch(() => setCategories([]));

    axios.get(`${API_BASE_URL}/api/funds`, { headers, params: { year, month } })
      .then(res => setFunds({ ...res.data, transactions: res.data.transactions || [] }))
      .catch(() => setFunds({ balance: 0, transactions: [] }));

  }, []);

  useEffect(() => {
    const headers = { 'ngrok-skip-browser-warning': 'true', Accept: 'application/json' };
    axios.get(`${API_BASE_URL}/api/users`, { headers })
      .then(res => setUsers(res.data.data.data || []))
      .catch(() => setUsers([]));
  }, []); 

  useEffect(() => {
    if (users.length === 0) return; 
    const headers = { 'ngrok-skip-browser-warning': 'true', Accept: 'application/json' };
    axios.get(`${API_BASE_URL}/api/checkouts`, { headers })
      .then(res => {
        const data = res.data?.data?.data || [];
        const withInitial = data.map(co => ({
          ...co,
          initial: users.find(u => u.id === co.user_id)?.initial || '—'
        }));
        setCheckouts(withInitial);
      })
      .catch(() => setCheckouts([]));

  }, [users]);

  const barDataFunds = useMemo(() => {
    const acc = {};
    funds.transactions.filter(tx => tx.type === 'out').forEach(tx => {
      const m = new Date(tx.date).getMonth();
      acc[m] = (acc[m] || 0) + tx.amount;
    });
    return monthNames.map((name, idx) => ({ x: name, y: acc[idx] || 0 }));
  }, [funds.transactions]);

  const barDataItems = useMemo(() => {
    const acc = {};
    checkouts.forEach(co => {
      const m = new Date(co.checkout_date).getMonth();
      const total = (co.items || []).reduce((s, i) => s + (i.checkout_quantity || 0), 0);
      acc[m] = (acc[m] || 0) + total;
    });
    return monthNames.map((name, idx) => ({ x: name, y: acc[idx] || 0 }));
  }, [checkouts]);

  const today = new Date().toISOString().slice(0, 10);
  const todayList = checkouts.filter(co => co.checkout_date.slice(0, 10) === today);
  const totalToday = todayList.reduce((sum, co) => {
    const qtyThisCheckout = (co.items || []).reduce((s, i) => s + (i.checkout_quantity || 0), 0);
    return sum + qtyThisCheckout;
  }, 0);

  const top3 = useMemo(() => {
    const map = {};
    checkouts.forEach(co => (co.items || []).forEach(i => {
      const name = i.product?.name || 'Unknown';
      map[name] = (map[name] || 0) + (i.checkout_quantity || 0);
    }));
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([label, value], idx) => ({ id: idx, label, value }));
  }, [checkouts]);

  const lowStock = useMemo(() =>
    products.filter(p => (p.stock || 0) <= (p.reorder_point || 0)),
    [products]
  );

  return (
    <Box className="bgcolor">
      <Navbar />
      <Box height={70} />
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <div className="flex items-center text-gray-600 text-sm mt-[-12px] mb-4">
            <Link to="/home" className="text-gray-400">Home</Link>
            <span className="mx-2 text-gray-400">•</span>
            <span>Dashboard</span>
          </div>

          <Grid container spacing={2} sx={{ mt: 5 }}>
            <Grid size={{ xs: 8 }}>
              <Stack spacing={2} direction="row">
                <Card sx={{ flex: 1, height: 160, bgcolor: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'left' }} >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'left', justifyContent: 'center', height: '100%', textAlign: 'left' }} >
                    <Box component="img" src="/Icon/stok.png" alt="barang" sx={{ width: 30, height: 30, mb: 1, mt: 2 }} />  
                    <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1, mb: 1 }} > {products.reduce((sum, p) => sum + (p.stock || 0), 0)} </Typography>
                    <Typography variant="subtitle2" color="text.secondary" >Total Stok Barang</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1, height: 160, bgcolor: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'left'}}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'left', justifyContent: 'center', height: '100%', textAlign: 'left' }}>
                    {/* (opsional) Ganti ikon jika mau */}
                    <Box component="img" src="/Icon/categories.png" alt="pengambilan" sx={{ width: 30, height: 30, mb: 1, mt: 2 }} />              
                    <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1, mb: 1 }}>
                      {totalToday}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Barang Diambil Hari Ini
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1, height: 160, bgcolor: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'left', justifyContent: 'center', height: '100%', textAlign: 'left' }}>
                    <Box component="img" src="/Icon/coin.png" alt="barang" sx={{ width: 30, height: 30, mb: 1, mt: 2 }} />                      
                      <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1, mb: 1 }}>Rp {funds.balance.toLocaleString()}</Typography>
                      <Typography variant="subtitle2" color="text.secondary">Total Dana Tahun Ini</Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
            <Grid size={{ xs: 3 }}>
              <Card sx={{ width: 341, height: 160, borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  p: 2 
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Pengambilan Barang Terbaru
                  </Typography>
                  <Divider sx={{ my: 1 }} />

                  {todayList.length ? (
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                      {todayList.map(co => (
                        <Box
                          key={co.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderLeft: '4px solid',
                            borderColor: 'primary.main',
                            pl: 1,
                            py: 0.5,
                            mb: 0.5
                          }}
                        >
                          <Typography variant="body2">
                            {co.initial}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(co.checkout_date).toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mt: 1, 
                    }}>
                      <Typography variant="body2" color="text.disabled" >
                        Tidak Ada Pengambilan Hari Ini
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ textAlign: 'right', mb:-2.5 }}>
                    <Button size="small" component={Link} to="/ambil">
                      Lihat Semua
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid size={{ xs: 8 }}>
              <Stack spacing={2}>
                <Card sx={{ height: '40vh' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Jumlah Barang Diambil Tiap Bulan</Typography>
                    <Box sx={{ height: '80%' }}>
                      <BarChart
                        dataset={barDataItems}
                        xAxis={[{ dataKey: 'x' }]}
                        series={[{ dataKey: 'y', label: 'Jumlah Barang' }]}
                        height={200}
                      />
                    </Box>
                  </CardContent>
                </Card>
                <Card sx={{ height: '40vh' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Pengeluaran Dana Tiap Bulan</Typography>
                    <Box sx={{ height: '80%' }}>
                      <BarChart
                        dataset={barDataFunds}
                        xAxis={[{ dataKey: 'x' }]}
                        series={[{ dataKey: 'y', label: 'Jumlah Rp' }]}
                        height={200}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Card sx={{ height: '40vh', mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Barang Paling Banyak Diambil</Typography>
                  <Box sx={{ width: '100%', height: '60%' }}>
                    <PieChart series={[{ data: top3 }]} width={200} height={200} />
                  </Box>
                </CardContent>
              </Card>
              <Card sx={{ height: '40vh', borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Barang yang Perlu Pengadaan
                  </Typography>
                  <Divider sx={{ my: 1 }} />

                  {lowStock.length ? (
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                      {lowStock.slice(0, 5).map(p => (
                        <Box
                          key={p.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderLeft: '4px solid',
                            borderColor: 'primary.main',
                            pl: 1,
                            py: 0.5,
                            mb: 0.5
                          }}
                        >
                          <Typography variant="body2">{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary" >
                            Stok: {p.stock}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      <Typography variant="body2" color="text.disabled">
                        Semua stok aman
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ textAlign: 'right', pt: 1 }}>
                    <Button size="small" component={Link} to="/barang">
                      Lihat Semua
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
