import { format } from 'date-fns';
import { APP_CONSTANTS } from '../config/constants';

// Tarih formatla
export const formatDate = (date, formatStr = APP_CONSTANTS.DATE_FORMAT) => {
  return format(new Date(date), formatStr);
};

// Para birimi formatla
export const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency
  }).format(amount);
};

// Metni büyük harfe çevir
export const toUpperCase = (text) => {
  return text.toUpperCase();
}; 