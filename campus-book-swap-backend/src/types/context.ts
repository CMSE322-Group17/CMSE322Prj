// src/types/context.ts
import { ReactNode } from "react";
import { AuthUser, ProcessedCartItem } from "./models";
import axios from "axios";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
  authAxios: typeof axios;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export interface CartContextType {
  cartItems: ProcessedCartItem[];
  cartCount: number;
  loading: boolean;
  error: string | null;
  addToCart: (
    book: any,
    transactionType?: string
  ) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateCartItemQuantity: (itemId: number, quantity: number) => Promise<void>;
  updateBorrowDetails: (
    itemId: number,
    details: { duration?: string; dueDate?: string }
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCartItems: () => Promise<void>;
}

export interface CartProviderProps {
  children: ReactNode;
}
