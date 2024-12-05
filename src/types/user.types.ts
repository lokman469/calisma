// Kullanıcı rol tipleri
export type UserRole = 'admin' | 'user' | 'guest';

// Kullanıcı verisi tipi
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Kullanıcı oturum açma verisi tipi
export interface LoginData {
  email: string;
  password: string;
}

// Kullanıcı kayıt verisi tipi
export interface RegisterData {
  name: string;
  email: string;
  password: string;
} 