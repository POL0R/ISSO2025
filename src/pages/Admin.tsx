import { useAuth } from '../context/AuthContext';
import AdminApprovals from '../components/AdminApprovals';

export default function Admin() {
  const { role } = useAuth();
  if (role !== 'admin') return <div style={{ color: '#000', background: '#fff', marginTop: '12svh', padding: 16 }}>Access denied</div>;
  return (
    <div style={{ color: '#000', background: '#fff', marginTop: '12svh', padding: 16 }}>
      <h2>Admin</h2>
      <h3>Pending Access Requests</h3>
      <AdminApprovals />
    </div>
  );
}


