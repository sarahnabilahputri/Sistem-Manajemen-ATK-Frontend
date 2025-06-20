import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

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
  ADD_ITEM_LOCAL: 'ADD_ITEM_LOCAL',
  UPDATE_ITEM_LOCAL: 'UPDATE_ITEM_LOCAL',
  REMOVE_ITEM_LOCAL: 'REMOVE_ITEM_LOCAL',
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
    case ActionTypes.ADD_ITEM_LOCAL:
      return { ...state, items: [...state.items, action.payload] };
    case ActionTypes.UPDATE_ITEM_LOCAL:
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? { ...item, reorder_quantity: action.payload.reorder_quantity } : item
        ),
      };
    case ActionTypes.REMOVE_ITEM_LOCAL:
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };
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
  const API_BASE_URL = import.meta.env.VITE_BASE_URL;

  const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    const headers = { 'ngrok-skip-browser-warning': 'true', Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return { headers };
  };

  const fetchCart = async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const resp = await axios.get(`${API_BASE_URL}/api/reorder-carts`, getHeaders());
      if (resp.data?.status === 'success') {
        const items = resp.data.data.map(item => ({
          ...item,
          reorder_quantity: parseFloat(item.reorder_quantity) || 0,
        }));
        dispatch({ type: ActionTypes.SET_CART, payload: items });
      }
    } catch (err) {
      console.error('fetchCart error', err);
      dispatch({ type: ActionTypes.SET_ERROR, payload: err });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const addToCart = async (product) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const resp = await axios.post(
        `${API_BASE_URL}/api/reorder-carts`,
        { product_id: product.id },
        getHeaders()
      );
      if (resp.data?.status === 'success') {
        const returned = resp.data.data;
        let qty = parseFloat(returned.reorder_quantity) || 0;
        if (qty <= 0) {
          try {
            await axios.patch(
              `${API_BASE_URL}/api/reorder-carts/${returned.id}`,
              { reorder_quantity: 1 },
              getHeaders()
            );
            qty = 1;
          } catch {}
        }
        await fetchCart();
      }
    } catch (err) {
      console.error('addToCart error', err);
      dispatch({ type: ActionTypes.SET_ERROR, payload: err });
      throw err;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const updateCartItem = async (itemId, newQty) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const resp = await axios.patch(
        `${API_BASE_URL}/api/reorder-carts/${itemId}`,
        { reorder_quantity: newQty },
        getHeaders()
      );
      if (resp.data?.status === 'success') {
        dispatch({ type: ActionTypes.UPDATE_ITEM_LOCAL, payload: { id: itemId, reorder_quantity: newQty } });
      }
    } catch (err) {
      console.error('updateCartItem error', err);
      dispatch({ type: ActionTypes.SET_ERROR, payload: err });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const removeCartItem = async (itemId) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      await axios.delete(`${API_BASE_URL}/api/reorder-carts/${itemId}`, getHeaders());
      dispatch({ type: ActionTypes.REMOVE_ITEM_LOCAL, payload: itemId });
    } catch (err) {
      console.error('removeCartItem error', err);
      dispatch({ type: ActionTypes.SET_ERROR, payload: err });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const checkout = async ({ reorder_date, delivery_date }) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const itemsPayload = state.items.map(item => ({ product_id: item.product_id, quantity: item.reorder_quantity }));
      const payload = { reorder_date, delivery_date, items: itemsPayload };
      const resp = await axios.post(
        `${API_BASE_URL}/api/reorders`,
        payload,
        getHeaders()
      );
      if (resp.data?.status === 'success') {
        dispatch({ type: ActionTypes.CLEAR_CART_LOCAL });
      }
      return resp.data;
    } catch (err) {
      console.error('checkout error', err);
      dispatch({ type: ActionTypes.SET_ERROR, payload: err });
      throw err;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const openCart = () => dispatch({ type: ActionTypes.SET_CART_OPEN, payload: true });
  const closeCart = () => dispatch({ type: ActionTypes.SET_CART_OPEN, payload: false });

  useEffect(() => {
    fetchCart();
  }, []);

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
