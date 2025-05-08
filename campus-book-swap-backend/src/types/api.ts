// src/types/api.ts
import {
  ProcessedBook,
  Category,
  ProcessedOrder,
  ProcessedCartItem,
} from "./models";

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface BookApiService {
  getFeaturedBooks(): Promise<ApiResponse<ProcessedBook[]>>;
  getPopularBooks(): Promise<ApiResponse<ProcessedBook[]>>;
  getBooksOfWeek(): Promise<ApiResponse<ProcessedBook[]>>;
  getBooksOfYear(): Promise<ApiResponse<ProcessedBook[]>>;
  getBookById(id: number): Promise<ApiResponse<ProcessedBook>>;
  getBooksByCategory(categoryId: number): Promise<ApiResponse<ProcessedBook[]>>;
  getCategories(): Promise<ApiResponse<Category[]>>;
  createBook(
    bookData: Partial<ProcessedBook>
  ): Promise<ApiResponse<ProcessedBook>>;
  updateBook(
    id: number,
    bookData: Partial<ProcessedBook>
  ): Promise<ApiResponse<ProcessedBook>>;
  deleteBook(id: number): Promise<ApiResponse<void>>;
}

export interface CartApiService {
  getCartItems(): Promise<ApiResponse<ProcessedCartItem[]>>;
  addToCart(
    item: Partial<ProcessedCartItem>
  ): Promise<ApiResponse<ProcessedCartItem>>;
  updateCartItem(
    id: number,
    updates: Partial<ProcessedCartItem>
  ): Promise<ApiResponse<ProcessedCartItem>>;
  removeFromCart(id: number): Promise<ApiResponse<void>>;
  clearCart(): Promise<ApiResponse<void>>;
}

export interface OrderApiService {
  createOrder(
    orderData: Partial<ProcessedOrder>
  ): Promise<ApiResponse<ProcessedOrder>>;
  getOrders(): Promise<ApiResponse<ProcessedOrder[]>>;
  getOrderById(id: number): Promise<ApiResponse<ProcessedOrder>>;
}
