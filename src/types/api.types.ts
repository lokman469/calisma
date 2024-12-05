// API yanıt tipi
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

// Sayfalama verisi tipi
export interface PaginationData<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

// Hata yanıtı tipi
export interface ErrorResponse {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
} 