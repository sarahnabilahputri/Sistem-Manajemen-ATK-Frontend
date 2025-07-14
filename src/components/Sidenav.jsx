import * as React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
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
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import Collapse from '@mui/material/Collapse';
import { useLocation } from 'react-router-dom';

const drawerWidth = 240;
const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const DEFAULT_AVATAR = `${API_BASE_URL}/assets/images/default_user.jpg`;

function getAvatarSrc(rawAvatar) {
  if (!rawAvatar) return DEFAULT_AVATAR;
  const cleaned = rawAvatar.replace(/^\//, "");
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (cleaned.startsWith("avatars/") || cleaned.startsWith("images/")) 
    return `${API_BASE_URL}/storage/${cleaned}`;
  return `${API_BASE_URL}/${cleaned}`;
}

export default function Sidenav({ user }) {

  console.log("Sidenav user:", user); 
  const avatarUrl = getAvatarSrc(user?.avatar);
  const navigate = useNavigate(); 
  const location = useLocation();
  const [openMasterData, setOpenMasterData] = useState(false);
  const [openKelolaUser, setOpenKelolaUser] = useState(false);
  const [openPengadaan, setOpenPengadaan] = useState(false);

  const handleToggleMasterData = () => {
    setOpenMasterData(!openMasterData);
  };

  const handleToggleKelolaUser = () => {
    setOpenKelolaUser(!openKelolaUser);
  };

  const handleTogglePengadaan = () => {
    setOpenPengadaan(!openPengadaan);
  };

  const logout = () => {
    const access_token = localStorage.getItem("access_token");
  
    fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).finally(() => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("user");
      navigate("/");
      window.location.reload();
    });
  };
  
  if (!user) {
    return null;
  }  

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', bgcolor: '#fff', },
        }}
      >
        <Toolbar />

        <Box
          sx={{
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f0f0f0', 
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#c1c1c1', 
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#808080', 
            },
          }}
        >
        {user ? (
        <>
          <Box
            sx={{ textAlign: "center", my: 3, mb: 1, cursor: "pointer" }}
            onClick={() => navigate("/profile")}
          >
            <Box
              component="img"
              src={avatarUrl}
              alt={user.name}
              onError={e => {
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
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
              primary={user?.name || "Nama Pengguna"}
              secondary={
                <>
                  <span>{user?.email}</span><br />
                  <span style={{ fontWeight: "bold", color: "#000" }}>
                    {user?.role || "Role tidak diketahui"}
                  </span>
                </>
              }
              primaryTypographyProps={{
                fontSize: "0.875rem",
                fontWeight: "bold",
              }}
              sx={{ textAlign: "center", mt: 1}}
            />
          </Box>
        </>
        ) : (
          <>
            <Box sx={{ textAlign: "center", my: 2 }}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  backgroundColor: "#ccc",
                  margin: "0 auto",
                }}
              />
              <Box
                sx={{
                  width: 100,
                  height: 20,
                  backgroundColor: "#ccc",
                  margin: "10px auto 5px",
                }}
              />
              <Box
                sx={{
                  width: 150,
                  height: 20,
                  backgroundColor: "#ccc",
                  margin: "5px auto",
                }}
              />
            </Box>
          </>
        )}
          <List>
              <ListItem disablePadding onClick={()=>{navigate("/home")}}>
                <ListItemButton selected={location.pathname === "/home"}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box
                    component="img"
                    src="/Icon/dash.png" 
                    alt="dashboard"
                    sx={{ width: 20, height: 20 }} 
                  /> 
                  </ListItemIcon >
                  <ListItemText primary="Dashboard" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }}  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding onClick={()=>{navigate("/dana")}}>
                <ListItemButton selected={location.pathname === "/dana"}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box
                    component="img"
                    src="/Icon/dollar.png" 
                    alt="dana"
                    sx={{ width: 20, height: 20 }} 
                  /> 
                  </ListItemIcon>
                  <ListItemText primary="Kelola Dana BAAK" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding onClick={()=>{navigate("/barang")}}>
                <ListItemButton selected={location.pathname === "/barang"}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box
                    component="img"
                    src="/Icon/file.png" 
                    alt="barang"
                    sx={{ width: 20, height: 20 }} 
                  />  
                  </ListItemIcon>
                  <ListItemText primary="Stok Barang" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>
              
              {/* MASTER DATA GROUP */}
              <ListItem disablePadding onClick={handleToggleMasterData}>
                <ListItemButton>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      component="img"
                      src="/Icon/folder.png"
                      alt="kategori"
                      sx={{ width: 20, height: 20 }}
                    />                  
                  </ListItemIcon>
                  <ListItemText primary="Master Data" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                  {openMasterData ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </ListItemButton>
              </ListItem>

              <Collapse in={openMasterData} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding onClick={() => navigate("/kategori")}>
                    <ListItemButton selected={location.pathname === "/kategori"}
                      sx={{
                        pl: 6.5,
                        position: "relative",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: "25%",
                          transform: "translateY(-50%)",
                          left: 24, 
                          width: 18,
                          height: 30,
                          borderLeft: "2px solid #D0D5DD", 
                          borderBottom: "2px solid #D0D5DD",
                          borderBottomLeftRadius: 8,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          component="img"
                          src="/Icon/blogs.png"
                          alt="kategori"
                          sx={{ width: 20, height: 20 }}
                        />
                      </ListItemIcon>
                      <ListItemText primary="Kategori" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem" } }} />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding onClick={() => navigate("/satuan")}>
                      <ListItemButton selected={location.pathname === "/satuan"}
                        sx={{
                          pl: 6.5,
                          position: "relative",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: "20%",
                            transform: "translateY(-50%)",
                            left: 24, 
                            width: 18,
                            height: 35,
                            borderLeft: "2px solid #D0D5DD", 
                            borderBottom: "2px solid #D0D5DD",
                            borderBottomLeftRadius: 8,
                          },
                        }}
                      >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          component="img"
                          src="/Icon/letter.png"
                          alt="satuan"
                          sx={{ width: 20, height: 20 }}
                        />
                      </ListItemIcon>
                      <ListItemText primary="Satuan" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem" } }} />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding onClick={() => navigate("/prodi")}>
                  <ListItemButton selected={location.pathname === "/prodi"}
                        sx={{
                          pl: 6.5,
                          position: "relative",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: "20%",
                            transform: "translateY(-50%)",
                            left: 24, 
                            width: 18,
                            height: 35,
                            borderLeft: "2px solid #D0D5DD", 
                            borderBottom: "2px solid #D0D5DD",
                            borderBottomLeftRadius: 8,
                          },
                        }}
                      >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          component="img"
                          src="/Icon/reading.png"
                          alt="prodi"
                          sx={{ width: 20, height: 20 }}
                        />
                      </ListItemIcon>
                      <ListItemText primary="Program Studi" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem" } }} />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding onClick={() => navigate("/kebutuhan")}>
                  <ListItemButton selected={location.pathname === "/kebutuhan"}
                        sx={{
                          pl: 6.5,
                          position: "relative",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: "20%",
                            transform: "translateY(-50%)",
                            left: 24, 
                            width: 18,
                            height: 35,
                            borderLeft: "2px solid #D0D5DD", 
                            borderBottom: "2px solid #D0D5DD",
                            borderBottomLeftRadius: 8,
                          },
                        }}
                      >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          component="img"
                          src="/Icon/need.png"
                          alt="prodi"
                          sx={{ width: 20, height: 20 }}
                        />
                      </ListItemIcon>
                      <ListItemText primary="Kebutuhan" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem" } }} />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>

              <ListItem disablePadding onClick={()=>{navigate("/ambil")}}>
                <ListItemButton selected={location.pathname === "/ambil"}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box
                    component="img"
                    src="/Icon/box.png" 
                    alt="ambil"
                    sx={{ width: 20, height: 20 }} 
                  />  
                  </ListItemIcon>
                  <ListItemText primary="Ambil Barang" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                </ListItemButton>
              </ListItem>

              {/* KELOLA USER GROUP */}
              <ListItem disablePadding onClick={handleTogglePengadaan}>
                <ListItemButton>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      component="img"
                      src="/Icon/stock.png"
                      alt="Pengadaan"
                      sx={{ width: 20, height: 20 }}
                    />                  
                  </ListItemIcon>
                  <ListItemText primary="Pengadaan" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                  {openPengadaan ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </ListItemButton>
              </ListItem>

              <Collapse in={openPengadaan} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding onClick={() => navigate("/pesan")}>
                    <ListItemButton selected={location.pathname === "/pesan"}
                      sx={{
                        pl: 6.5,
                        position: "relative",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: "25%",
                          transform: "translateY(-50%)",
                          left: 24, 
                          width: 18,
                          height: 30,
                          borderLeft: "2px solid #D0D5DD", 
                          borderBottom: "2px solid #D0D5DD",
                          borderBottomLeftRadius: 8,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          component="img"
                          src="/Icon/shopping-cart.png"
                          alt="pesan"
                          sx={{ width: 20, height: 20 }}
                        />
                      </ListItemIcon>
                      <ListItemText primary="Pesan Barang" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem" } }} />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding onClick={() => navigate("/terima")}>
                    <ListItemButton selected={location.pathname === "/terima"}
                      sx={{
                        pl: 6.5,
                        position: "relative",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: "25%",
                          transform: "translateY(-50%)",
                          left: 24, 
                          width: 18,
                          height: 30,
                          borderLeft: "2px solid #D0D5DD", 
                          borderBottom: "2px solid #D0D5DD",
                          borderBottomLeftRadius: 8,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          component="img"
                          src="/Icon/package.png"
                          alt="kategori"
                          sx={{ width: 20, height: 20 }}
                        />
                      </ListItemIcon>
                      <ListItemText primary="Terima Barang" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem" } }} />
                    </ListItemButton>
                  </ListItem>
    
                </List>
              </Collapse>

              {/* KELOLA USER GROUP */}
              <ListItem disablePadding onClick={handleToggleKelolaUser}>
                <ListItemButton>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      component="img"
                      src="/Icon/user.png"
                      alt="kategori"
                      sx={{ width: 20, height: 20 }}
                    />                  
                  </ListItemIcon>
                  <ListItemText primary="Kelola User" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem", fontWeight: "semibold" } }} />
                  {openKelolaUser ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </ListItemButton>
              </ListItem>

              <Collapse in={openKelolaUser} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding onClick={() => navigate("/user")}>
                    <ListItemButton selected={location.pathname === "/user"}
                      sx={{
                        pl: 6.5,
                        position: "relative",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: "25%",
                          transform: "translateY(-50%)",
                          left: 24, 
                          width: 18,
                          height: 30,
                          borderLeft: "2px solid #D0D5DD", 
                          borderBottom: "2px solid #D0D5DD",
                          borderBottomLeftRadius: 8,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          component="img"
                          src="/Icon/baak.png"
                          alt="kategori"
                          sx={{ width: 20, height: 20 }}
                        />
                      </ListItemIcon>
                      <ListItemText primary="BAAK" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem" } }} />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding onClick={() => navigate("/staf")}>
                    <ListItemButton selected={location.pathname === "/staf"}
                      sx={{
                        pl: 6.5,
                        position: "relative",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: "25%",
                          transform: "translateY(-50%)",
                          left: 24, 
                          width: 18,
                          height: 30,
                          borderLeft: "2px solid #D0D5DD", 
                          borderBottom: "2px solid #D0D5DD",
                          borderBottomLeftRadius: 8,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          component="img"
                          src="/Icon/staf.png"
                          alt="kategori"
                          sx={{ width: 20, height: 20 }}
                        />
                      </ListItemIcon>
                      <ListItemText primary="Staf" sx={{ "& .MuiTypography-root": { fontSize: "0.875rem" } }} />
                    </ListItemButton>
                  </ListItem>
    
                </List>
              </Collapse>

              <ListItem disablePadding onClick={logout}>
                <ListItemButton>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LogoutIcon sx={{ color: "red" }} />
                  </ListItemIcon>
                  <ListItemText primary="Logout" sx={{ color: "red", fontWeight: "bold" }} />
                </ListItemButton>
              </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
