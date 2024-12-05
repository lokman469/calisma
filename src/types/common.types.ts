// Tema modu tipi
export type ThemeMode = 'light' | 'dark';

// Bildirim tipi
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  createdAt: string;
}

// Form hata mesajları tipi
export type FormErrors<T> = Partial<Record<keyof T, string>>;

// Rota tipi
export interface Route {
  path: string;
  element: React.ComponentType;
  auth: boolean;
} 