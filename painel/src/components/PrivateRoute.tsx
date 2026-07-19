import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');

  // Se tem token, deixa passar (retorna o componente), se não, manda pro /login
  return token ? children : <Navigate to="/login" />;
}