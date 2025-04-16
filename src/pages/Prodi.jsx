import React from "react";
import Sidenav from "../components/Sidenav";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Navbar from "../components/Navbar";
import ProdiList from "./Prodi/ProdiList";
import { Link } from "react-router-dom"; // Import React Router untuk navigasi

export default function Prodi() {
    return (
      <>
      <div className="bgcolor">
      <Navbar />
      <Box height={70} />
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <h1 className="text-3xl font-bold mb-4">Program Studi</h1>
        <div className="flex items-center text-gray-600 text-sm mt-[-12px] mb-4">
          <Link to="/home" className="text-gray-400 ">Home</Link>
          <span className="mx-2 text-gray-400">•</span>
          <span>Program Studi</span>
        </div>
        <ProdiList />    
        </Box>
      </Box>
      </div>
      </>
    );
}