import React from "react";
import Sidenav from "./components/Sidenav";
import {Routes, Route, BrowserRouter, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Kategori from "./pages/Kategori";
import Dana from "./pages/Dana";
import Barang from "./pages/Barang";
import Pesan from "./pages/Pesan";
import Ambil from "./pages/Ambil";
import User from "./pages/User";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Satuan from "./pages/Satuan";
import Prodi from "./pages/Prodi";
import Staf from "./pages/Staf";
import { useState, useEffect } from 'react';
import { Box, Toolbar } from "@mui/material";
import { useTheme } from '@mui/material/styles';

const drawerWidth = 0; 
const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export default function App() {
  
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation(); // Pakai useLocation DI DALAM BrowserRouter
  

  useEffect(() => {
    const access_token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    

    if (access_token && storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    } else if (access_token) {
      fetch(`${API_BASE_URL}/api/auth/authorize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const hideSidebar = location.pathname === "/" || location.pathname === "/callback";

  return (
    <Box sx={{ display: 'flex' }}>
      {!hideSidebar && user && <Sidenav user={user} /> }
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto', 
          backgroundColor: '#f9f9f9',
          paddingTop: '1px', // Untuk beri ruang bawah navbar
          marginLeft: !hideSidebar && user ? `${drawerWidth}px` : 0,
          width: !hideSidebar && user ? `calc(100% - ${drawerWidth}px)` : '100%',
        }}
      >
        
        <Routes>
          <Route path="/" element={<Login setUser={setUser} />} />
          <Route path="/callback" element={<Login setUser={setUser} />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dana" element={<Dana />} />
          <Route path="/barang" element={<Barang />} />
          <Route path="/kategori" element={<Kategori />} />
          <Route path="/prodi" element={<Prodi />} />
          <Route path="/satuan" element={<Satuan />} />
          <Route path="/pesan" element={<Pesan />} />
          <Route path="/ambil" element={<Ambil />} />
          <Route path="/user" element={<User />} />
          <Route path="/staf" element={<Staf />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Box>
    </Box>
  );   
}