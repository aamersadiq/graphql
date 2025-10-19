'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL queries and mutations
const GET_CART = gql`
  query GetCart {
    cart {
      id
      items {
        id
        productId
        name
        price
        quantity
        imageUrl
      }
      totalItems
      totalPrice
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart($productId: ID!, $quantity: Int!) {
    addToCart(productId: $productId, quantity: $quantity) {
      id
      items {
        id
        productId
        name
        price
        quantity
        imageUrl
      }
      totalItems
      totalPrice
    }
  }
`;

const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($itemId: ID!, $quantity: Int!) {
    updateCartItem(itemId: $itemId, quantity: $quantity) {
      id
      items {
        id
        productId
        name
        price
        quantity
        imageUrl
      }
      totalItems
      totalPrice
    }
  }
`;

const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($itemId: ID!) {
    removeFromCart(itemId: $itemId) {
      id
      items {
        id
        productId
        name
        price
        quantity
        imageUrl
      }
      totalItems
      totalPrice
    }
  }
`;

const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart {
      id
      items {
        id
      }
      totalItems
      totalPrice
    }
  }
`;

// Types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Local storage key
const CART_STORAGE_KEY = 'ecommerce-cart';

// Default empty cart
const defaultCart: Cart = {
  id: '',
  items: [],
  totalItems: 0,
  totalPrice: 0
};

export function useCart() {
  // State for cart data
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // GraphQL operations
  const { data, loading, refetch } = useQuery(GET_CART, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.cart) {
        setCart(data.cart.items || []);
        setTotalPrice(data.cart.totalPrice || 0);
        setTotalItems(data.cart.totalItems || 0);
        // Sync with local storage
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data.cart));
      }
    },
    onError: (error) => {
      console.error('Error fetching cart:', error);
      // Try to load from local storage if network request fails
      loadCartFromLocalStorage();
    }
  });

  const [addToCartMutation] = useMutation(ADD_TO_CART);
  const [updateCartItemMutation] = useMutation(UPDATE_CART_ITEM);
  const [removeFromCartMutation] = useMutation(REMOVE_FROM_CART);
  const [clearCartMutation] = useMutation(CLEAR_CART);

  // Load cart from local storage
  const loadCartFromLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart) as Cart;
          setCart(parsedCart.items || []);
          setTotalPrice(parsedCart.totalPrice || 0);
          setTotalItems(parsedCart.totalItems || 0);
        }
      } catch (error) {
        console.error('Error loading cart from local storage:', error);
      }
    }
  }, []);

  // Initialize cart from local storage on mount
  useEffect(() => {
    loadCartFromLocalStorage();
  }, [loadCartFromLocalStorage]);

  // Calculate totals whenever cart changes
  useEffect(() => {
    const newTotalItems = cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
    const newTotalPrice = cart.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
    
    setTotalItems(newTotalItems);
    setTotalPrice(newTotalPrice);
  }, [cart]);

  // Add item to cart
  const addItem = async (productId: string, quantity = 1) => {
    try {
      const { data } = await addToCartMutation({
        variables: { productId, quantity }
      });
      
      if (data?.addToCart) {
        setCart(data.addToCart.items);
        setTotalPrice(data.addToCart.totalPrice);
        setTotalItems(data.addToCart.totalItems);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data.addToCart));
      }
      
      return data?.addToCart;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      // Fallback to local cart management if API fails
      const existingItemIndex = cart.findIndex((item: CartItem) => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += quantity;
        setCart(updatedCart);
      } else {
        // Add new item (would need product details from somewhere)
        // This is a simplified fallback that would need product data
        console.warn('Local cart fallback requires product data');
      }
    }
  };

  // Update item quantity
  const updateItem = async (itemId: string, quantity: number) => {
    try {
      const { data } = await updateCartItemMutation({
        variables: { itemId, quantity }
      });
      
      if (data?.updateCartItem) {
        setCart(data.updateCartItem.items);
        setTotalPrice(data.updateCartItem.totalPrice);
        setTotalItems(data.updateCartItem.totalItems);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data.updateCartItem));
      }
      
      return data?.updateCartItem;
    } catch (error) {
      console.error('Error updating cart item:', error);
      // Fallback to local cart management
      const updatedCart = cart.map((item: CartItem) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      setCart(updatedCart);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      const { data } = await removeFromCartMutation({
        variables: { itemId }
      });
      
      if (data?.removeFromCart) {
        setCart(data.removeFromCart.items);
        setTotalPrice(data.removeFromCart.totalPrice);
        setTotalItems(data.removeFromCart.totalItems);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data.removeFromCart));
      }
      
      return data?.removeFromCart;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      // Fallback to local cart management
      const updatedCart = cart.filter((item: CartItem) => item.id !== itemId);
      setCart(updatedCart);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const { data } = await clearCartMutation();
      
      if (data?.clearCart) {
        setCart([]);
        setTotalPrice(0);
        setTotalItems(0);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      
      return data?.clearCart;
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Fallback to local cart management
      setCart([]);
      setTotalPrice(0);
      setTotalItems(0);
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  return {
    cart,
    loading,
    totalPrice,
    totalItems,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refetchCart: refetch
  };
}