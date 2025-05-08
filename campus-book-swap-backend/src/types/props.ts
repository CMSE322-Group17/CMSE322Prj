// src/types/props.ts
import {
  ProcessedBook,
  ProcessedCartItem,
  BookCondition,
  TransactionType,
} from "./models";

export interface BookCardProps {
  book: ProcessedBook;
  onClick?: (book: ProcessedBook) => void;
}

export interface BookDetailsProps {
  book: ProcessedBook;
  onClose: () => void;
}

export interface CartItemProps {
  item: ProcessedCartItem;
}

export interface MinicartProps {
  onClose: () => void;
}

export interface BookFormProps {
  bookToEdit?: ProcessedBook | null;
  onSuccess: (book: ProcessedBook) => void;
}

export interface FilterProps {
  sort: string;
  condition: string | BookCondition;
  priceRange: string;
  bookType: string | TransactionType;
  onChange: (filterType: string, value: string) => void;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
}
