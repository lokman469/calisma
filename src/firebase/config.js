import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Firebase yapılandırma bilgilerinizi buraya ekleyin
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 