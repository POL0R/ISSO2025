import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Scoreboard from './pages/Scoreboard';
import MatchPage from './pages/Match';
import Admin from './pages/Admin';
import RequestAccess from './pages/RequestAccess';
import Login from './pages/Login';

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/scoreboard', element: <Scoreboard /> },
  { path: '/match/:id', element: <MatchPage /> },
  { path: '/admin', element: <Admin /> },
  { path: '/request-access', element: <RequestAccess /> }
  ,{ path: '/login', element: <Login /> }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}


