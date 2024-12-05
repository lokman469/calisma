// E-posta doğrulama
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Şifre doğrulama (en az 8 karakter, bir büyük harf, bir küçük harf, bir sayı)
export const isValidPassword = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return re.test(password);
};

// Boş alan kontrolü
export const isEmpty = (value) => {
  return value === null || value === undefined || value.trim() === '';
}; 