import React from "react";
import Sidenav from "./components/Sidenav";
import {Routes, Route, BrowserRouter} from "react-router-dom";
import Home from "./pages/Home";
import Kategori from "./pages/Kategori";
import Dana from "./pages/Dana";
import Barang from "./pages/Barang";
import Pesan from "./pages/Pesan";
import Ambil from "./pages/Ambil";
import User from "./pages/User";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" exact element={<Login />}></Route>
        <Route path="/home" exact element={<Home />}></Route>
        <Route path="/dana" exact element={<Dana />}></Route>
        <Route path="/barang" exact element={<Barang />}></Route>
        <Route path="/kategori" exact element={<Kategori />}></Route>
        <Route path="/pesan" exact element={<Pesan />}></Route>
        <Route path="/ambil" exact element={<Ambil />}></Route>
        <Route path="/user" exact element={<User />}></Route>
        <Route path="/profile" exact element={<Profile />}></Route>
      </Routes>
    </BrowserRouter>
    </>
  )
}