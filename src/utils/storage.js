// Yerel depolamaya veri kaydet
export const setItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Yerel depolamadan veri al
export const getItem = (key) => {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

// Yerel depolamadan veri sil
export const removeItem = (key) => {
  localStorage.removeItem(key);
};

// Tüm yerel depolamayı temizle
export const clearStorage = () => {
  localStorage.clear();
}; 