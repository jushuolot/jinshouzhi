import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Rules from './pages/Rules';
import Deposit from './pages/Deposit';
import { getToken } from './api';

function Private({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/" element={<Private><Home /></Private>} />
      <Route path="/deposit" element={<Private><Deposit /></Private>} />
      <Route path="/chat/:id" element={<Private><Chat /></Private>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
