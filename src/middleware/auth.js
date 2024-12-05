import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  MANAGE: 'manage'
};

export const auth = (requiredRole = ROLES.USER) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Yetkilendirme token\'ı gerekli');
      }

      const token = authHeader.split(' ')[1];
      const auth = getAuth();
      
      // Token'ı doğrula
      const decodedToken = await auth.verifyIdToken(token);
      if (!decodedToken) {
        throw new Error('Geçersiz token');
      }

      // Kullanıcı bilgilerini al
      const userDoc = await getDoc(doc(db, 'users', decodedToken.uid));
      if (!userDoc.exists()) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const userData = userDoc.data();
      
      // Rol kontrolü
      if (requiredRole && userData.role !== ROLES.ADMIN && userData.role !== requiredRole) {
        throw new Error('Yetersiz yetki');
      }

      // Request objesine kullanıcı bilgilerini ekle
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        role: userData.role,
        permissions: userData.permissions || [],
        metadata: userData.metadata || {},
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Yetki kontrolü
export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      const hasPermission = req.user.role === ROLES.ADMIN || 
        req.user.permissions.includes(requiredPermission);

      if (!hasPermission) {
        throw new Error('Yetersiz yetki');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Role bazlı yetkilendirme
export const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      const hasRole = Array.isArray(roles) 
        ? roles.includes(req.user.role)
        : req.user.role === roles;

      if (!hasRole) {
        throw new Error('Yetersiz rol');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export { ROLES, PERMISSIONS }; 