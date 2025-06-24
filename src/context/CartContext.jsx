// src/contexts/CartContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CartContext = createContext();

const initialState = {
  items: [],
  loading: false,
  error: null,
  isCartOpen: false,
};

const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CART: 'SET_CART',
  CLEAR_CART_LOCAL: 'CLEAR_CART_LOCAL',
  SET_CART_OPEN: 'SET_CART_OPEN',
};

function cartReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case ActionTypes.SET_CART:
      return { ...state, items: action.payload };
    case ActionTypes.CLEAR_CART_LOCAL:
      return { ...state, items: [] };
    case ActionTypes.SET_CART_OPEN:
      return { ...state, isCartOpen: action.payload };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_BASE_URL; // pastikan ini sudah di-set di .env

  // Menghasilkan config headers untuk axios
  const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    const headers = {
      'ngrok-skip-browser-warning': 'true',
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return { headers };
  };

  // Jika token invalid / 401, hapus token & redirect ke login
  const handleUnauthorized = () => {
    console.warn('[CartContext] Unauthorized detected: clearing token and redirecting to login.');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
    dispatch({ type: ActionTypes.CLEAR_CART_LOCAL });
    // Navigate ke login (asumsi route "/" adalah login)
    navigate('/', { replace: true });
  };

  const fetchCart = async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        // Tidak ada token: skip fetch, clear cart
        dispatch({ type: ActionTypes.CLEAR_CART_LOCAL });
        return;
      }
      const resp = await axios.get(`${API_BASE_URL}/api/reorder-carts`, getHeaders());
      if (resp.data?.status === 'success') {
        const items = resp.data.data.map(item => ({
          ...item,
          reorder_quantity: parseFloat(item.reorder_quantity) || 0,
        }));
        dispatch({ type: ActionTypes.SET_CART, payload: items });
      } else {
        // Jika response status != success: bisa clear atau set error
        console.warn('[CartContext] fetchCart: response status not success:', resp.data);
      }
    } catch (err) {
      console.error('[CartContext] fetchCart error', err);
      if (err.response?.status === 401) {
        handleUnauthorized();
      } else {
        dispatch({ type: ActionTypes.SET_ERROR, payload: err });
      }
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const addToCart = async (product) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        handleUnauthorized();
        throw new Error('Not authenticated');
      }
      const resp = await axios.post(
        `${API_BASE_URL}/api/reorder-carts`,
        { product_id: product.id },
        getHeaders()
      );
      if (resp.data?.status === 'success') {
        // Setelah POST berhasil, fetch ulang cart
        await fetchCart();
      } else {
        console.warn('[CartContext] addToCart: response status not success:', resp.data);
      }
    } catch (err) {
      console.error('[CartContext] addToCart error', err);
      if (err.response?.status === 401) {
        handleUnauthorized();
      } else {
        dispatch({ type: ActionTypes.SET_ERROR, payload: err });
      }
      throw err;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const updateCartItem = async (itemId, newQty) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        handleUnauthorized();
        throw new Error('Not authenticated');
      }
      const resp = await axios.patch(
        `${API_BASE_URL}/api/reorder-carts/${itemId}`,
        { reorder_quantity: newQty },
        getHeaders()
      );
      if (resp.data?.status === 'success') {
        // Update local state tanpa fetch ulang penuh
        // Namun untuk konsistensi server-client, bisa juga fetch ulang:
        // await fetchCart();
        // Di sini kita hanya dispatch local update:
        const updatedItems = state.items.map(item =>
          item.id === itemId
            ? { ...item, reorder_quantity: newQty }
            : item
        );
        dispatch({ type: ActionTypes.SET_CART, payload: updatedItems });
      } else {
        console.warn('[CartContext] updateCartItem: response status not success:', resp.data);
      }
    } catch (err) {
      console.error('[CartContext] updateCartItem error', err);
      if (err.response?.status === 401) {
        handleUnauthorized();
      } else {
        dispatch({ type: ActionTypes.SET_ERROR, payload: err });
      }
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const removeCartItem = async (itemId) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        handleUnauthorized();
        throw new Error('Not authenticated');
      }
      const resp = await axios.delete(
        `${API_BASE_URL}/api/reorder-carts/${itemId}`,
        getHeaders()
      );
      // Jika server merespon sukses, hapus lokal:
      if (resp.status === 200 || resp.data?.status === 'success') {
        const filtered = state.items.filter(item => item.id !== itemId);
        dispatch({ type: ActionTypes.SET_CART, payload: filtered });
      } else {
        console.warn('[CartContext] removeCartItem: response not success:', resp.data);
      }
    } catch (err) {
      console.error('[CartContext] removeCartItem error', err);
      if (err.response?.status === 401) {
        handleUnauthorized();
      } else {
        dispatch({ type: ActionTypes.SET_ERROR, payload: err });
      }
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const checkout = async ({ reorder_date, delivery_date }) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        handleUnauthorized();
        throw new Error('Not authenticated');
      }
      // Siapkan payload
      const itemsPayload = state.items.map(item => ({
        product_id: item.product_id,
        quantity: item.reorder_quantity,
      }));
      const payload = { reorder_date, delivery_date, items: itemsPayload };
      const resp = await axios.post(
        `${API_BASE_URL}/api/reorders`,
        payload,
        getHeaders()
      );
      if (resp.data?.status === 'success') {
        // Clear local cart setelah checkout sukses
        dispatch({ type: ActionTypes.CLEAR_CART_LOCAL });
      } else {
        console.warn('[CartContext] checkout: response status not success:', resp.data);
      }
      return resp.data;
    } catch (err) {
      console.error('[CartContext] checkout error', err);
      if (err.response?.status === 401) {
        handleUnauthorized();
      } else {
        dispatch({ type: ActionTypes.SET_ERROR, payload: err });
      }
      throw err;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const openCart = () => {
    dispatch({ type: ActionTypes.SET_CART_OPEN, payload: true });
  };
  const closeCart = () => {
    dispatch({ type: ActionTypes.SET_CART_OPEN, payload: false });
  };

  useEffect(() => {
    // Hanya panggil fetchCart sekali saat mount, jika token ada
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCart();
    } else {
      dispatch({ type: ActionTypes.CLEAR_CART_LOCAL });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps: hanya saat mount

  return (
    <CartContext.Provider value={{
      items: state.items,
      loading: state.loading,
      error: state.error,
      isCartOpen: state.isCartOpen,
      fetchCart,
      addToCart,
      updateCartItem,
      removeCartItem,
      checkout,
      openCart,
      closeCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
