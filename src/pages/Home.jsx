import React from "react";
import Sidenav from "../components/Sidenav";
import Navbar from "../components/Navbar"
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import "../Dash.css";
import { Link } from "react-router-dom";

export default function Home() {
    return (
      <>
      <div className="bgcolor">
      <Navbar />
      <Box height={70} />
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <div className="flex items-center text-gray-600 text-sm mt-[-12px] mb-4">
          <Link to="/home" className="text-gray-400 ">Home</Link>
          <span className="mx-2 text-gray-400">•</span>
          <span>Dashboard</span>
        </div>  
          <Grid container spacing={2}>
            <Grid item xs={8}>
            <Stack spacing={2} direction="row">
              <Card sx={{ minWidth: 32 + "%", height: 180 }}>
                <CardContent>
            
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 32 + "%", height: 180 }}>
                <CardContent>
                  
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 32 + "%", height: 180 }}>
                <CardContent>
                 
                </CardContent>
              </Card>
            </Stack>
            </Grid>
            <Grid item xs={4}>
            <Stack spacing={2}>
              <Card sx={{ minWidth: 32 + "%", height: 180 }}>
                <CardContent>
                 
                </CardContent>
              </Card>
            </Stack>
            </Grid>
          </Grid>
          <Box height={20} />
          <Grid container spacing={2}>
            <Grid item xs={8}>
            <Stack spacing={2}>
               <Card sx={{ height: 40 + "vh" }}>
                <CardContent>
                
                </CardContent>
              </Card>
              <Card sx={{ height: 40 + "vh"  }}>
                <CardContent>
                  
                </CardContent>
              </Card>
            </Stack>  
            </Grid>
            <Grid item xs={4}>
            <Card sx={{ height: 40 + "vh"  }}>
                <CardContent>
                  
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
      </div>
     
      </>
    );
}