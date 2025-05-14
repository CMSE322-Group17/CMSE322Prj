// src/types/models.ts
import {
  StrapiImage,
  StrapiRelationData,
  StrapiRelationCollection,
} from "./strapi";

// Book types
export type BookCondition =
  | "New"
  | "Like New"
  | "Very Good"
  | "Good"
  | "Acceptable"
  | "Poor";
export type BookType = "For Sale" | "For Swap" | "For Borrowing";

export interface Book {
  title: string;
  author: string;
  description: string;
  condition: BookCondition;
  price: number | null;
  exchange?: string;
  subject?: string;
  course?: string;
  seller?: string;
  bookType: BookType;
  featured: boolean;
  bookOfWeek: boolean;
  bookOfYear: boolean;
  rating?: number;
  votersCount?: number;
  displayTitle?: string;
  cover?: StrapiRelationData<StrapiImage>;
  category?: StrapiRelationData<Category>;
  users_permissions_user?: StrapiRelationData<User>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface ProcessedBook {
  id: number;
  title: string;
  author: string;
  description?: string;
  condition: BookCondition;
  price: number | null;
  exchange?: string;
  subject?: string;
  course?: string;
  seller?: string;
  bookType: BookType;
  featured?: boolean;
  bookOfWeek?: boolean;
  bookOfYear?: boolean;
  rating?: number;
  voters?: number;
  displayTitle?: string[];
  cover?: string | null;
  categoryId?: number | null;
  inStock?: number;
  isNew?: boolean;
  likes?: LikeUser[];
}

export interface LikeUser {
  id: number;
  name: string;
  img?: string;
}

// Category type
export interface Category {
  name: string;
  type?: string;
  books?: StrapiRelationCollection<Book>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// User type
export interface User {
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  books?: StrapiRelationCollection<Book>;
  cart_items?: StrapiRelationCollection<CartItem>;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  token: string;
}

// Message type
export type MessageType =
  | "general"
  | "swap_offer"
  | "swap_accepted"
  | "swap_declined"
  | "borrow_request"
  | "borrow_accepted"
  | "borrow_declined";

export interface Message {
  chatId: string;
  senderId: number;
  receiverId: number;
  bookId: number;
  text: string;
  timestamp: string;
  messageType?: MessageType;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface ProcessedMessage extends Message {
  id: number;
  otherUserId?: number;
  otherUser?: User;
  book?: ProcessedBook;
  transactionType?: TransactionType;
}

// SwapOffer type
export type SwapOfferStatus = "pending" | "accepted" | "declined" | "completed";

export interface SwapOffer {
  chatId: string;
  buyerId: number;
  sellerId: number;
  bookId: number;
  offerBookIds: number[];
  status: SwapOfferStatus;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface ProcessedSwapOffer extends SwapOffer {
  id: number;
  book?: ProcessedBook;
  otherUser?: User;
  isUserBuyer?: boolean;
}

// BorrowRequest type
export type BorrowRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "borrowed"
  | "returned";

export interface BorrowRequest {
  borrowerId: number;
  lenderId: number;
  bookId: number;
  duration: string;
  returnDate: string;
  depositAmount: number;
  status: BorrowRequestStatus;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface ProcessedBorrowRequest extends BorrowRequest {
  id: number;
  book?: ProcessedBook;
  otherUser?: User;
  isUserBorrower?: boolean;
  daysUntilDue?: number;
  isOverdue?: boolean;
}

// CartItem type
export type TransactionType = "buy" | "borrow" | "swap";

export interface CartItem {
  bookId: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  cover?: string;
  transactionType?: TransactionType;
  depositAmount?: number;
  borrowDuration?: string;
  dueDate?: string;
  users_permissions_user?: StrapiRelationData<User>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface ProcessedCartItem {
  id: number;
  bookId: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  cover?: string;
  transactionType?: TransactionType;
  depositAmount?: number;
  borrowDuration?: string;
  dueDate?: string;
}

// Order type
export type OrderStatus = "pending" | "completed" | "cancelled";

export interface OrderItem {
  bookId: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  transactionType: TransactionType;
}

export interface Order {
  userId: number;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface ProcessedOrder {
  id: number;
  userId: number;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  timestamp: string;
}
