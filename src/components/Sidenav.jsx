import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import {useNavigate} from "react-router-dom";
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import LogoutIcon from "@mui/icons-material/Logout";
import { useState, useEffect } from 'react';

const drawerWidth = 240;

export default function Sidenav() {
  const navigate = useNavigate(); 

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />

        <Box sx={{ overflow: 'auto' }}>
          {/* Foto Profil */}
          <Box
            sx={{ textAlign: "center", my: 2, cursor: "pointer" }}
            onClick={() => navigate("/profile")} 
            >
            <Box
              component="img"
              src="/profile.jpeg"
              alt="Profile"
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                objectFit: "cover",
                display: "block",
                margin: "0 auto",
              }}
            />
            <ListItemText
              primary="SARAH NABILAH PUTRI"
              sx={{ textAlign: "center", mt: 1, fontWeight: "bold" }}
            />
            </Box>
          <List>
              <ListItem disablePadding onClick={()=>{navigate("/home")}}>
                <ListItemButton>
                  <ListItemIcon>
                  <Box
                    component="img"
                    src="/Icon/dash.png" // Sesuaikan dengan path gambar
                    alt="dashboard"
                    sx={{ width: 20, height: 20 }} // Sesuaikan ukuran ikon
                  /> 
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }}  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding onClick={()=>{navigate("/dana")}}>
                <ListItemButton>
                  <ListItemIcon>
                  <Box
                    component="img"
                    src="/Icon/dollar.png" // Sesuaikan dengan path gambar
                    alt="dana"
                    sx={{ width: 20, height: 20 }} // Sesuaikan ukuran ikon
                  /> 
                  </ListItemIcon>
                  <ListItemText primary="Kelola Dana BAAK" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding onClick={()=>{navigate("/barang")}}>
                <ListItemButton>
                  <ListItemIcon>
                  <Box
                    component="img"
                    src="/Icon/file.png" // Sesuaikan dengan path gambar
                    alt="barang"
                    sx={{ width: 20, height: 20 }} // Sesuaikan ukuran ikon
                  />  
                  </ListItemIcon>
                  <ListItemText primary="Master Data Barang" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding onClick={()=>{navigate("/kategori")}}>
                <ListItemButton>
                  <ListItemIcon>
                  <Box
                    component="img"
                    src="/Icon/blogs.png" // Sesuaikan dengan path gambar
                    alt="kategori"
                    sx={{ width: 20, height: 20 }} // Sesuaikan ukuran ikon
                  />  
                  </ListItemIcon>
                  <ListItemText primary="Master Data Kategori" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding onClick={()=>{navigate("/satuan")}}>
                <ListItemButton>
                  <ListItemIcon>
                  <Box
                    component="img"
                    src="/Icon/letter.png" // Sesuaikan dengan path gambar
                    alt="satuan"
                    sx={{ width: 20, height: 20 }} // Sesuaikan ukuran ikon
                  />  
                  </ListItemIcon>
                  <ListItemText primary="Kelola Data Satuan" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding onClick={()=>{navigate("/prodi")}}>
                <ListItemButton>
                  <ListItemIcon>
                  <Box
                    component="img"
                    src="/Icon/reading.png" // Sesuaikan dengan path gambar
                    alt="prodi"
                    sx={{ width: 20, height: 20 }} // Sesuaikan ukuran ikon
                  />  
                  </ListItemIcon>
                  <ListItemText primary="Program Studi" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding onClick={()=>{navigate("/pesan")}}>
                <ListItemButton>
                  <ListItemIcon>
                  <Box
                    component="img"
                    src="/Icon/stock.png" // Sesuaikan dengan path gambar
                    alt="pesan"
                    sx={{ width: 20, height: 20 }} // Sesuaikan ukuran ikon
                  />  
                  </ListItemIcon>
                  <ListItemText primary="Pemesanan Barang" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding onClick={()=>{navigate("/ambil")}}>
                <ListItemButton>
                  <ListItemIcon>
                  <Box
                    component="img"
                    src="/Icon/box.png" // Sesuaikan dengan path gambar
                    alt="ambil"
                    sx={{ width: 20, height: 20 }} // Sesuaikan ukuran ikon
                  />  
                  </ListItemIcon>
                  <ListItemText primary="Ambil Barang" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding onClick={()=>{navigate("/user")}}>
                <ListItemButton>
                  <ListItemIcon>
                  <Box
                    component="img"
                    src="/Icon/user.png" // Sesuaikan dengan path gambar
                    alt="user"
                    sx={{ width: 20, height: 20 }} // Sesuaikan ukuran ikon
                  />  
                  </ListItemIcon>
                  <ListItemText primary="Kelola User" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>
              {/* <ListItem disablePadding onClick={logout}>
                <ListItemButton>
                  <ListItemIcon>
                    <LogoutIcon sx={{ color: "red" }} />
                  </ListItemIcon>
                  <ListItemText primary="Logout" sx={{ color: "red", fontWeight: "bold" }} />
                </ListItemButton>
              </ListItem> */}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
