import { lazy } from 'react';

// Sayfa bileşenlerini lazy loading ile import et
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Route yapılandırmaları
const routes = [
  {
    path: '/',
    element: Home,
    auth: false
  },
  {
    path: '/login',
    element: Login,
    auth: false
  },
  {
    path: '/register',
    element: Register,
    auth: false
  },
  {
    path: '/profile',
    element: Profile,
    auth: true
  },
  {
    path: '/settings',
    element: Settings,
    auth: true
  },
  {
    path: '*',
    element: NotFound,
    auth: false
  }
];

export default routes; 